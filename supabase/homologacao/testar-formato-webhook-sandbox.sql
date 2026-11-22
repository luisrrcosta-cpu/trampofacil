-- Testes negativos adicionais de formato do webhook sandbox.
-- Executar exclusivamente no Supabase TrampoFacil-Homologacao.
BEGIN;
SET LOCAL ROLE service_role;
DO $$
DECLARE h text;
BEGIN
  FOREACH h IN ARRAY ARRAY['',repeat('A',64),'a'||repeat('b',62)||'z'] LOOP
    BEGIN
      PERFORM private.receber_webhook_sandbox(h,ARRAY['CHAR_TESTE-1']);
      RAISE EXCEPTION 'FALHA: hash inválido aceito';
    EXCEPTION WHEN sqlstate '22023' THEN
      IF SQLERRM <> 'Notificação inválida.' THEN RAISE; END IF;
    END;
  END LOOP;
  BEGIN
    PERFORM private.receber_webhook_sandbox(repeat('b',64),ARRAY['CHAR_TESTE-1','CHAR_TESTE-1']);
    RAISE EXCEPTION 'FALHA: cobrança duplicada aceita';
  EXCEPTION WHEN sqlstate '22023' THEN
    IF SQLERRM <> 'Notificação inválida.' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM private.receber_webhook_sandbox(repeat('b',64),ARRAY['INVALIDO']);
    RAISE EXCEPTION 'FALHA: identificador inválido aceito';
  EXCEPTION WHEN sqlstate '22023' THEN
    IF SQLERRM <> 'Notificação inválida.' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM private.receber_webhook_sandbox(repeat('b',64),ARRAY[]::text[]);
    RAISE EXCEPTION 'FALHA: lista vazia aceita';
  EXCEPTION WHEN sqlstate '22023' THEN
    IF SQLERRM <> 'Notificação inválida.' THEN RAISE; END IF;
  END;
END $$;
ROLLBACK;
