-- Homologação: registro inerte com bloqueio transacional e validação da contratação vigente.
-- Compatível com service_role sem UPDATE em private.preparacoes_pagamento.
-- Nenhum pagamento, repasse ou integração real é habilitado.
create unique index if not exists tentativas_unicas_por_preparacao_teste
  on private.tentativas_pagamento_teste (preparacao_id);

create or replace function private.registrar_tentativa_inerte(
  p_preparacao_id uuid, p_chave_idempotencia uuid
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
 v_preparacao private.preparacoes_pagamento%rowtype;
 v_solicitacao public.solicitacoes%rowtype;
 v_existente private.tentativas_pagamento_teste%rowtype;
 v_id uuid;
begin
 if p_preparacao_id is null or p_chave_idempotencia is null then
   raise exception 'Tentativa inválida';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_preparacao_id::text, 0));
 select * into v_preparacao from private.preparacoes_pagamento
 where id=p_preparacao_id;
 if not found or v_preparacao.ambiente<>'teste'
   or v_preparacao.estado<>'preparada'
   or v_preparacao.pagamento_habilitado<>false then
   raise exception 'Preparação indisponível';
 end if;
 select * into v_solicitacao from public.solicitacoes
 where id=v_preparacao.solicitacao_id for update;
 if not found or v_solicitacao.status<>'aceita'
   or v_solicitacao.atualizado_em is distinct from v_preparacao.versao_orcamento
   or v_solicitacao.valor_centavos is distinct from v_preparacao.valor_servico_centavos
   or v_solicitacao.cliente_usuario_id is distinct from v_preparacao.cliente_usuario_id
   or v_solicitacao.profissional_usuario_id is distinct from v_preparacao.profissional_usuario_id then
   raise exception 'Contratação alterada ou indisponível';
 end if;
 select * into v_existente from private.tentativas_pagamento_teste
 where preparacao_id=p_preparacao_id;
 if found then
   if v_existente.chave_idempotencia<>p_chave_idempotencia
     or v_existente.valor_centavos<>v_preparacao.valor_servico_centavos then
     raise exception 'Tentativa já registrada com parâmetros diferentes';
   end if;
   return v_existente.id;
 end if;
 insert into private.tentativas_pagamento_teste
   (preparacao_id,chave_idempotencia,valor_centavos)
 values (p_preparacao_id,p_chave_idempotencia,v_preparacao.valor_servico_centavos)
 returning id into v_id;
 insert into private.eventos_tentativa_pagamento_teste(tentativa_id,tipo)
 values (v_id,'criada');
 return v_id;
end;
$function$;
revoke all on function private.registrar_tentativa_inerte(uuid,uuid)
  from public, anon, authenticated;
grant execute on function private.registrar_tentativa_inerte(uuid,uuid)
  to service_role;

comment on function private.registrar_tentativa_inerte(uuid,uuid) is
  'Somente service_role; registro inerte, idempotente e vinculado à contratação vigente, sem operação no PagBank.';
