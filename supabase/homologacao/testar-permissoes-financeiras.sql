-- Homologação: auditoria somente leitura das permissões financeiras.
-- Falha imediatamente se algum papel receber acesso indevido.
do $$
begin
 if has_function_privilege('anon','private.registrar_tentativa_inerte(uuid,uuid)','EXECUTE')
    or has_function_privilege('authenticated','private.registrar_tentativa_inerte(uuid,uuid)','EXECUTE') then
  raise exception 'FALHA: clientes ou visitantes podem executar a função financeira';
 end if;
 if not has_function_privilege('service_role','private.registrar_tentativa_inerte(uuid,uuid)','EXECUTE') then
  raise exception 'FALHA: service_role sem permissão de execução';
 end if;
 if has_table_privilege('service_role','private.preparacoes_pagamento','UPDATE')
    or has_table_privilege('service_role','private.tentativas_pagamento_teste','DELETE') then
  raise exception 'FALHA: service_role com permissão financeira excessiva';
 end if;
 if (select prosecdef from pg_proc
     where oid='private.registrar_tentativa_inerte(uuid,uuid)'::regprocedure) then
  raise exception 'FALHA: função passou a executar como SECURITY DEFINER';
 end if;
end $$;
