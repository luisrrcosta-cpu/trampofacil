-- Auditoria somente leitura de privilégios do serviço nas tabelas PagBank sandbox.
-- Projeto: TrampoFacil-Homologacao. Não altera permissões nem dados.
DO $$
DECLARE checkout record; webhook record;
BEGIN
 SELECT has_table_privilege('service_role','private.checkouts_pagbank_sandbox','SELECT') AS ler,
        has_table_privilege('service_role','private.checkouts_pagbank_sandbox','INSERT') AS inserir,
        has_table_privilege('service_role','private.checkouts_pagbank_sandbox','UPDATE') AS atualizar,
        has_table_privilege('service_role','private.checkouts_pagbank_sandbox','DELETE') AS excluir
 INTO checkout;
 SELECT has_table_privilege('service_role','private.recebimentos_webhook_sandbox','SELECT') AS ler,
        has_table_privilege('service_role','private.recebimentos_webhook_sandbox','INSERT') AS inserir,
        has_table_privilege('service_role','private.recebimentos_webhook_sandbox','UPDATE') AS atualizar,
        has_table_privilege('service_role','private.recebimentos_webhook_sandbox','DELETE') AS excluir
 INTO webhook;
 IF NOT (checkout.ler AND checkout.inserir AND checkout.atualizar AND NOT checkout.excluir
         AND webhook.ler AND webhook.inserir AND NOT webhook.atualizar AND NOT webhook.excluir) THEN
   RAISE EXCEPTION 'Permissões financeiras divergentes do esperado.';
 END IF;
END $$;
