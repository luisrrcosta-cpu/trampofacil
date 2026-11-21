-- Verificação transacional de privilégios financeiros.
-- Executar somente no projeto TrampoFacil-Homologacao.
begin;
do $$
begin
  if has_table_privilege('service_role','private.preparacoes_pagamento','UPDATE') then
    raise exception 'FALHA: serviço pode alterar preparações';
  end if;
  if has_table_privilege('service_role','private.tentativas_pagamento_teste','UPDATE') then
    raise exception 'FALHA: serviço pode alterar tentativas';
  end if;
  if has_function_privilege('authenticated','private.registrar_tentativa_inerte(uuid,uuid)','EXECUTE') then
    raise exception 'FALHA: cliente pode registrar tentativa';
  end if;
  if has_function_privilege('anon','private.registrar_tentativa_inerte(uuid,uuid)','EXECUTE') then
    raise exception 'FALHA: visitante pode registrar tentativa';
  end if;
end $$;
rollback;
