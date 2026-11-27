-- Base isolada de rascunhos contratuais. Testar antes de gerar migração/aplicar.
-- Não instala RPC pública, aceites, bloqueio de início ou termos vigentes.
begin;
create table private.versoes_rascunho_contrato (
 id uuid primary key default gen_random_uuid(),
 solicitacao_id uuid not null references public.solicitacoes(id),
 revisao integer not null check(revisao>0),
 anterior_id uuid,
 revisao_anterior integer,
 orcamento_em timestamptz not null,
 snapshot jsonb not null check(jsonb_typeof(snapshot)='object'),
 conteudo_serializado text not null check(octet_length(conteudo_serializado) between 1 and 65536),
 hash_sha256 text not null check(hash_sha256 ~ '^[0-9a-f]{64}$'),
 autor_usuario_id uuid not null references auth.users(id),
 criado_em timestamptz not null,
 unique(solicitacao_id,revisao),
 unique(id,solicitacao_id,revisao),
 foreign key(anterior_id,solicitacao_id,revisao_anterior)
 references private.versoes_rascunho_contrato(id,solicitacao_id,revisao),
 check((revisao=1 and anterior_id is null and revisao_anterior is null)
  or(revisao>1 and anterior_id is not null and revisao_anterior=revisao-1))
);
alter table private.versoes_rascunho_contrato enable row level security;
revoke all on private.versoes_rascunho_contrato from public,anon,authenticated,service_role;

create function private.registrar_versao_rascunho() returns trigger
language plpgsql security invoker set search_path='' as $$
declare uid uuid:=auth.uid(); pedido public.solicitacoes%rowtype; campo text;
 anterior private.versoes_rascunho_contrato%rowtype; esperado integer; dados jsonb;
begin
 if uid is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false' then
 raise exception 'Entre em uma conta autenticada' using errcode='42501';end if;
 -- Mesmo lock do pedido: serializa revisões e confere o orçamento atual.
 select * into pedido from public.solicitacoes s where s.id=new.solicitacao_id for update;
 if not found or uid not in(pedido.cliente_usuario_id,pedido.profissional_usuario_id) then
 raise exception 'Pedido indisponível' using errcode='42501';end if;
 if pedido.status not in('proposta','aceita') or pedido.valor_centavos is null then
 raise exception 'Orçamento completo obrigatório' using errcode='22023';end if;
 if new.orcamento_em is distinct from pedido.atualizado_em then
 raise exception 'Orçamento mudou; consulte novamente' using errcode='40001';end if;
 dados:=new.conteudo_serializado::jsonb;
 if dados is distinct from new.snapshot or jsonb_typeof(dados)<>'object' or
 not(dados ?& array['formato','solicitacao_id','cliente_usuario_id','profissional_usuario_id','versao_minuta','escopo','materiais_descricao','mao_obra_centavos','materiais_centavos','total_centavos','inicio_previsto','fim_previsto','condicoes'])
 or (select count(*) from jsonb_object_keys(dados))<>13 then
 raise exception 'Conteúdo do rascunho inválido' using errcode='22023';end if;
 if dados->>'formato' is distinct from 'trampofacil.contrato-rascunho.v1'
 or dados->>'solicitacao_id' is distinct from pedido.id::text
 or dados->>'cliente_usuario_id' is distinct from pedido.cliente_usuario_id::text
 or dados->>'profissional_usuario_id' is distinct from pedido.profissional_usuario_id::text
 or pedido.cliente_usuario_id=pedido.profissional_usuario_id then
 raise exception 'Partes ou pedido divergentes' using errcode='22023';end if;
 foreach campo in array array['formato','solicitacao_id','cliente_usuario_id','profissional_usuario_id','versao_minuta','escopo','materiais_descricao','inicio_previsto','fim_previsto','condicoes'] loop
 if jsonb_typeof(dados->campo) is distinct from 'string' then raise exception 'Texto contratual inválido' using errcode='22023';end if;
 end loop;
 if (dados->>'versao_minuta') !~ '^[a-z0-9][a-z0-9._-]{0,63} pela futura RPC; storage não substitui autorização.
 if jsonb_typeof(dados->'mao_obra_centavos')<>'number' or jsonb_typeof(dados->'materiais_centavos')<>'number'
 or jsonb_typeof(dados->'total_centavos')<>'number'
 or (dados->>'mao_obra_centavos') !~ '^[0-9]+$' or (dados->>'materiais_centavos') !~ '^[0-9]+$'
 or (dados->>'total_centavos') !~ '^[0-9]+$' then raise exception 'Valores inválidos' using errcode='22023';end if;
 if (dados->>'mao_obra_centavos')::numeric+(dados->>'materiais_centavos')::numeric<>(dados->>'total_centavos')::numeric
 or (dados->>'total_centavos')::numeric<>pedido.valor_centavos
 or pedido.valor_centavos not between 100 and 100000000 then
 raise exception 'Valores divergem do orçamento' using errcode='22023';end if;
 select * into anterior from private.versoes_rascunho_contrato v
 where v.solicitacao_id=new.solicitacao_id order by v.revisao desc limit 1;
 esperado:=coalesce(anterior.revisao,0)+1;
 if new.anterior_id is distinct from anterior.id or
 (new.revisao is not null and new.revisao<>esperado) then
 raise exception 'Revisão mudou; consulte novamente' using errcode='40001';end if;
 new.revisao:=esperado;new.revisao_anterior:=anterior.revisao;
 new.autor_usuario_id:=uid;new.criado_em:=clock_timestamp();
 new.hash_sha256:=encode(sha256(convert_to(new.conteudo_serializado,'UTF8')),'hex');
 return new;
end;$$;
create trigger registrar_versao_rascunho before insert on private.versoes_rascunho_contrato
 for each row execute function private.registrar_versao_rascunho();

create function private.impedir_alteracao_rascunho() returns trigger
language plpgsql security invoker set search_path='' as $$
begin raise exception 'Versões contratuais são imutáveis' using errcode='42501';end;$$;
create trigger preservar_versao_rascunho before update or delete on private.versoes_rascunho_contrato
 for each row execute function private.impedir_alteracao_rascunho();
revoke all on function private.registrar_versao_rascunho(),private.impedir_alteracao_rascunho()
 from public,anon,authenticated,service_role;
commit;

 or char_length(btrim(dados->>'escopo')) not between 10 and 3000
 or char_length(btrim(dados->>'materiais_descricao')) not between 2 and 2000
 or char_length(btrim(dados->>'condicoes')) not between 10 and 3000
 or (dados->>'inicio_previsto') !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2} pela futura RPC; storage não substitui autorização.
 if jsonb_typeof(dados->'mao_obra_centavos')<>'number' or jsonb_typeof(dados->'materiais_centavos')<>'number'
 or jsonb_typeof(dados->'total_centavos')<>'number'
 or (dados->>'mao_obra_centavos') !~ '^[0-9]+$' or (dados->>'materiais_centavos') !~ '^[0-9]+$'
 or (dados->>'total_centavos') !~ '^[0-9]+$' then raise exception 'Valores inválidos' using errcode='22023';end if;
 if (dados->>'mao_obra_centavos')::numeric+(dados->>'materiais_centavos')::numeric<>(dados->>'total_centavos')::numeric
 or (dados->>'total_centavos')::numeric<>pedido.valor_centavos
 or pedido.valor_centavos not between 100 and 100000000 then
 raise exception 'Valores divergem do orçamento' using errcode='22023';end if;
 select * into anterior from private.versoes_rascunho_contrato v
 where v.solicitacao_id=new.solicitacao_id order by v.revisao desc limit 1;
 esperado:=coalesce(anterior.revisao,0)+1;
 if new.anterior_id is distinct from anterior.id or
 (new.revisao is not null and new.revisao<>esperado) then
 raise exception 'Revisão mudou; consulte novamente' using errcode='40001';end if;
 new.revisao:=esperado;new.revisao_anterior:=anterior.revisao;
 new.autor_usuario_id:=uid;new.criado_em:=clock_timestamp();
 new.hash_sha256:=encode(sha256(convert_to(new.conteudo_serializado,'UTF8')),'hex');
 return new;
end;$$;
create trigger registrar_versao_rascunho before insert on private.versoes_rascunho_contrato
 for each row execute function private.registrar_versao_rascunho();

create function private.impedir_alteracao_rascunho() returns trigger
language plpgsql security invoker set search_path='' as $$
begin raise exception 'Versões contratuais são imutáveis' using errcode='42501';end;$$;
create trigger preservar_versao_rascunho before update or delete on private.versoes_rascunho_contrato
 for each row execute function private.impedir_alteracao_rascunho();
revoke all on function private.registrar_versao_rascunho(),private.impedir_alteracao_rascunho()
 from public,anon,authenticated,service_role;
commit;

 or (dados->>'fim_previsto') !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2} pela futura RPC; storage não substitui autorização.
 if jsonb_typeof(dados->'mao_obra_centavos')<>'number' or jsonb_typeof(dados->'materiais_centavos')<>'number'
 or jsonb_typeof(dados->'total_centavos')<>'number'
 or (dados->>'mao_obra_centavos') !~ '^[0-9]+$' or (dados->>'materiais_centavos') !~ '^[0-9]+$'
 or (dados->>'total_centavos') !~ '^[0-9]+$' then raise exception 'Valores inválidos' using errcode='22023';end if;
 if (dados->>'mao_obra_centavos')::numeric+(dados->>'materiais_centavos')::numeric<>(dados->>'total_centavos')::numeric
 or (dados->>'total_centavos')::numeric<>pedido.valor_centavos
 or pedido.valor_centavos not between 100 and 100000000 then
 raise exception 'Valores divergem do orçamento' using errcode='22023';end if;
 select * into anterior from private.versoes_rascunho_contrato v
 where v.solicitacao_id=new.solicitacao_id order by v.revisao desc limit 1;
 esperado:=coalesce(anterior.revisao,0)+1;
 if new.anterior_id is distinct from anterior.id or
 (new.revisao is not null and new.revisao<>esperado) then
 raise exception 'Revisão mudou; consulte novamente' using errcode='40001';end if;
 new.revisao:=esperado;new.revisao_anterior:=anterior.revisao;
 new.autor_usuario_id:=uid;new.criado_em:=clock_timestamp();
 new.hash_sha256:=encode(sha256(convert_to(new.conteudo_serializado,'UTF8')),'hex');
 return new;
end;$$;
create trigger registrar_versao_rascunho before insert on private.versoes_rascunho_contrato
 for each row execute function private.registrar_versao_rascunho();

create function private.impedir_alteracao_rascunho() returns trigger
language plpgsql security invoker set search_path='' as $$
begin raise exception 'Versões contratuais são imutáveis' using errcode='42501';end;$$;
create trigger preservar_versao_rascunho before update or delete on private.versoes_rascunho_contrato
 for each row execute function private.impedir_alteracao_rascunho();
revoke all on function private.registrar_versao_rascunho(),private.impedir_alteracao_rascunho()
 from public,anon,authenticated,service_role;
commit;
 then
 raise exception 'Dados contratuais incompletos' using errcode='22023';end if;
 if (dados->>'fim_previsto')::date < (dados->>'inicio_previsto')::date then
 raise exception 'Prazos inválidos' using errcode='22023';end if;
 -- O módulo de validação também será executado pela futura RPC; storage não substitui autorização.
 if jsonb_typeof(dados->'mao_obra_centavos')<>'number' or jsonb_typeof(dados->'materiais_centavos')<>'number'
 or jsonb_typeof(dados->'total_centavos')<>'number'
 or (dados->>'mao_obra_centavos') !~ '^[0-9]+$' or (dados->>'materiais_centavos') !~ '^[0-9]+$'
 or (dados->>'total_centavos') !~ '^[0-9]+$' then raise exception 'Valores inválidos' using errcode='22023';end if;
 if (dados->>'mao_obra_centavos')::numeric+(dados->>'materiais_centavos')::numeric<>(dados->>'total_centavos')::numeric
 or (dados->>'total_centavos')::numeric<>pedido.valor_centavos
 or pedido.valor_centavos not between 100 and 100000000 then
 raise exception 'Valores divergem do orçamento' using errcode='22023';end if;
 select * into anterior from private.versoes_rascunho_contrato v
 where v.solicitacao_id=new.solicitacao_id order by v.revisao desc limit 1;
 esperado:=coalesce(anterior.revisao,0)+1;
 if new.anterior_id is distinct from anterior.id or
 (new.revisao is not null and new.revisao<>esperado) then
 raise exception 'Revisão mudou; consulte novamente' using errcode='40001';end if;
 new.revisao:=esperado;new.revisao_anterior:=anterior.revisao;
 new.autor_usuario_id:=uid;new.criado_em:=clock_timestamp();
 new.hash_sha256:=encode(sha256(convert_to(new.conteudo_serializado,'UTF8')),'hex');
 return new;
end;$$;
create trigger registrar_versao_rascunho before insert on private.versoes_rascunho_contrato
 for each row execute function private.registrar_versao_rascunho();

create function private.impedir_alteracao_rascunho() returns trigger
language plpgsql security invoker set search_path='' as $$
begin raise exception 'Versões contratuais são imutáveis' using errcode='42501';end;$$;
create trigger preservar_versao_rascunho before update or delete on private.versoes_rascunho_contrato
 for each row execute function private.impedir_alteracao_rascunho();
revoke all on function private.registrar_versao_rascunho(),private.impedir_alteracao_rascunho()
 from public,anon,authenticated,service_role;
commit;
