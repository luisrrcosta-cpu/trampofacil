-- Testes de idempotência e validação do recebimento de webhook sandbox.
-- Exclusivamente TrampoFacil-Homologacao. Todos os dados são revertidos.
BEGIN;
SET LOCAL ROLE service_role;
DO $$
DECLARE h text := repeat('a',64); primeiro boolean; repetido boolean;
BEGIN
 primeiro := private.receber_webhook_sandbox(h,ARRAY['CHAR_TESTE-123']);
 repetido := private.receber_webhook_sandbox(h,ARRAY['CHAR_TESTE-123']);
 IF primeiro IS DISTINCT FROM true OR repetido IS DISTINCT FROM false THEN
   RAISE EXCEPTION 'Falha de idempotência no webhook';
 END IF;
 BEGIN
   PERFORM private.receber_webhook_sandbox(h,ARRAY['CHAR_TESTE-456']);
   RAISE EXCEPTION 'Falha: divergência aceita';
 EXCEPTION WHEN sqlstate '22023' THEN
   IF SQLERRM <> 'Notificação divergente.' THEN RAISE; END IF;
 END;
 BEGIN
   PERFORM private.receber_webhook_sandbox('invalido',ARRAY['CHAR_TESTE-123']);
   RAISE EXCEPTION 'Falha: hash inválido aceito';
 EXCEPTION WHEN sqlstate '22023' THEN
   IF SQLERRM <> 'Notificação inválida.' THEN RAISE; END IF;
 END;
END $$;
ROLLBACK;
