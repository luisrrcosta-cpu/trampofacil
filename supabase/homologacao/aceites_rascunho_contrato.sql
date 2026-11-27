-- Candidato de ensaio: sem RPC pública, permissão de cliente ou efeito financeiro.
-- Depende de versoes_rascunho_contrato.sql. Não aplicar isoladamente no Supabase.
begin;
create table private.aceites_rascunho_contrato (
 id uuid primary key default gen_random_uuid(),
 versao_id uuid not null references private.versoes_rascunho_contrato(id),
 usuario_id uuid not null references auth.users(id),
 papel text not null check(papel in ('cliente','profissional')),
 sessao_id uuid not null,
 operacao_id uuid not null,
 hash_exibido text not null check(hash_exibido ~ '^[0-9a-f]{64}$'),
 declaracao_confirmada boolean not null check(declaracao_confirmada is true),
 criado_em timestamptz not null,
 unique(versao_id,usuario_id),
 unique(usuario_id,operacao_id)
);
alter table private.aceites_rascunho_contrato enable row level security;
revoke all on private.aceites_rascunho_contrato from public,anon,authenticated,service_role;

create function private.validar_aceite_rascunho() returns trigger
language plpgsql security invoker set search_path='' as $$
declare
 uid uuid:=auth.uid(); claims jsonb:=auth.jwt(); sid uuid;
 versao private.versoes_rascunho_contrato%rowtype;
 pedido public.solicitacoes%rowtype; prazo timestamptz;
begin
 if uid is null or claims->'is_anonymous' is distinct from 'false'::jsonb
 or claims->>'role' is distinct from 'authenticated'
 or jsonb_typeof(claims->'exp') is distinct from 'number' then
 raise exception 'Sessão autenticada obrigatória' using errcode='42501';end if;
 if (claims->>'exp')::numeric <= extract(epoch from clock_timestamp()) then
 raise exception 'Sessão expirada' using errcode='42501';end if;
 if coalesce(claims->>'session_id','') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
 raise exception 'Sessão inválida' using errcode='42501';end if;
 sid:=(claims->>'session_id')::uuid;
 -- A sessão deve continuar existente até o fim da transação de aceite.
 select s.not_after into prazo from auth.sessions s where s.id=sid and s.user_id=uid for share;
 if not found or (prazo is not null and prazo<=clock_timestamp()) then
 raise exception 'Sessão revogada ou expirada' using errcode='42501';end if;
 select * into versao from private.versoes_rascunho_contrato v where v.id=new.versao_id;
 if not found then raise exception 'Contrato indisponível' using errcode='42501';end if;
 -- Ordem consistente com o versionamento: lock no pedido antes da decisão.
 select * into pedido from public.solicitacoes p where p.id=versao.solicitacao_id for update;
 if not found or (uid is distinct from pedido.cliente_usuario_id and uid is distinct from pedido.profissional_usuario_id)
 or pedido.cliente_usuario_id is null or pedido.profissional_usuario_id is null
 or pedido.cliente_usuario_id=pedido.profissional_usuario_id then
 raise exception 'Contrato indisponível' using errcode='42501';end if;
 -- Revalidar o tempo depois de uma eventual espera no lock do pedido.
 if (claims->>'exp')::numeric <= extract(epoch from clock_timestamp())
 or (prazo is not null and prazo<=clock_timestamp()) then
 raise exception 'Sessão expirada durante o aceite' using errcode='42501';end if;
 if pedido.status is null or pedido.status not in ('proposta','aceita')
 or pedido.valor_centavos is distinct from (versao.snapshot->>'total_centavos')::integer
 or pedido.atualizado_em is distinct from versao.orcamento_em
 or versao.snapshot->>'cliente_usuario_id' is distinct from pedido.cliente_usuario_id::text
 or versao.snapshot->>'profissional_usuario_id' is distinct from pedido.profissional_usuario_id::text
 or exists(select 1 from private.versoes_rascunho_contrato v where v.solicitacao_id=pedido.id and v.revisao>versao.revisao) then
 raise exception 'Contrato mudou; consulte a versão atual' using errcode='40001';end if;
 if new.hash_exibido is distinct from versao.hash_sha256 or new.declaracao_confirmada is distinct from true then
 raise exception 'Confirme expressamente o conteúdo exibido' using errcode='22023';end if;
 new.usuario_id:=uid;new.sessao_id:=sid;new.criado_em:=clock_timestamp();
 new.papel:=case when uid=pedido.cliente_usuario_id then 'cliente' else 'profissional' end;
 return new;
end;$$;
create trigger validar_aceite_rascunho before insert on private.aceites_rascunho_contrato
 for each row execute function private.validar_aceite_rascunho();
create trigger preservar_aceite_rascunho before update or delete on private.aceites_rascunho_contrato
 for each row execute function private.impedir_alteracao_rascunho();
revoke all on function private.validar_aceite_rascunho() from public,anon,authenticated,service_role;
commit;
