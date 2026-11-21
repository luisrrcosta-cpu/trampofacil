-- Uma única tentativa inerte por preparação. Não permite checkout ou cobrança.
create unique index tentativas_unicas_por_preparacao_teste
  on private.tentativas_pagamento_teste (preparacao_id);

create or replace function private.registrar_tentativa_inerte(
  p_preparacao_id uuid,
  p_chave_idempotencia uuid
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_preparacao private.preparacoes_pagamento%rowtype;
  v_existente private.tentativas_pagamento_teste%rowtype;
  v_id uuid;
begin
  if p_preparacao_id is null or p_chave_idempotencia is null then
    raise exception 'Tentativa inválida';
  end if;
  select * into v_preparacao
  from private.preparacoes_pagamento
  where id = p_preparacao_id
  for update;
  if not found or v_preparacao.ambiente <> 'teste'
     or v_preparacao.estado <> 'preparada'
     or v_preparacao.pagamento_habilitado <> false then
    raise exception 'Preparação indisponível';
  end if;
  select * into v_existente
  from private.tentativas_pagamento_teste
  where preparacao_id = p_preparacao_id;
  if found then
    if v_existente.chave_idempotencia <> p_chave_idempotencia
       or v_existente.valor_centavos <> v_preparacao.valor_servico_centavos then
      raise exception 'Tentativa já registrada com parâmetros diferentes';
    end if;
    return v_existente.id;
  end if;
  insert into private.tentativas_pagamento_teste
    (preparacao_id,chave_idempotencia,valor_centavos)
  values (p_preparacao_id,p_chave_idempotencia,v_preparacao.valor_servico_centavos)
  returning id into v_id;
  insert into private.eventos_tentativa_pagamento_teste
    (tentativa_id,tipo)
  values (v_id,'criada');
  return v_id;
end;
$$;
revoke all on function private.registrar_tentativa_inerte(uuid,uuid) from public, anon, authenticated;
grant execute on function private.registrar_tentativa_inerte(uuid,uuid) to service_role;
comment on function private.registrar_tentativa_inerte(uuid,uuid) is
  'Somente service_role; registro inerte e idempotente, sem operação no PagBank.';
