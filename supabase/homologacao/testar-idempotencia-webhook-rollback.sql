-- Executar somente na homologação. Teste transacional, sem dados persistentes.
BEGIN;
DO $$
DECLARE
  h text := repeat('b',64);
  primeiro boolean;
  segundo boolean;
  rejeitou boolean := false;
BEGIN
  primeiro := private.receber_webhook_sandbox(h,ARRAY['CHAR_TESTE-1']);
  segundo := private.receber_webhook_sandbox(h,ARRAY['CHAR_TESTE-1']);
  IF primeiro IS DISTINCT FROM true OR segundo IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Idempotência falhou: %, %', primeiro, segundo;
  END IF;
  BEGIN
    PERFORM private.receber_webhook_sandbox(h,ARRAY['CHAR_OUTRO-2']);
  EXCEPTION WHEN SQLSTATE '22023' THEN
    rejeitou := true;
  END;
  IF NOT rejeitou THEN
    RAISE EXCEPTION 'Hash divergente não foi rejeitado';
  END IF;
  IF (SELECT count(*) FROM private.recebimentos_webhook_sandbox WHERE hash_sha256=h) <> 1 THEN
    RAISE EXCEPTION 'Duplicidade persistida';
  END IF;
END $$;
ROLLBACK;
