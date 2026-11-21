-- Auditoria sem escrita: invariantes de idempotência na homologação.
-- A existência de índices e lock não substitui teste com duas conexões.
do $$
declare
  v_definicao text;
begin
  if not exists (
    select 1 from pg_index i
    join pg_class t on t.oid=i.indrelid
    join pg_namespace n on n.oid=t.relnamespace
    join pg_attribute a on a.attrelid=t.oid and a.attnum=any(i.indkey)
    where n.nspname='private' and t.relname='tentativas_pagamento_teste'
      and i.indisunique and i.indisvalid and i.indnatts=1
      and a.attname='preparacao_id'
  ) then
    raise exception 'FALHA: índice único válido por preparação ausente';
  end if;
  if not exists (
    select 1 from pg_index i
    join pg_class t on t.oid=i.indrelid
    join pg_namespace n on n.oid=t.relnamespace
    join pg_attribute a on a.attrelid=t.oid and a.attnum=any(i.indkey)
    where n.nspname='private' and t.relname='tentativas_pagamento_teste'
      and i.indisunique and i.indisvalid and i.indnatts=1
      and a.attname='chave_idempotencia'
  ) then
    raise exception 'FALHA: índice único válido por chave ausente';
  end if;
  v_definicao:=pg_get_functiondef('private.registrar_tentativa_inerte(uuid,uuid)'::regprocedure);
  if position('pg_advisory_xact_lock' in v_definicao)=0 then
    raise exception 'FALHA: bloqueio transacional ausente';
  end if;
end;
$$;
