-- Seis casos de entrada inválida. Somente homologação; nada persiste.
BEGIN;
DO $$
DECLARE
  h text;
  rejeitou boolean;
  caso text;
  arr text[];
BEGIN
  FOR caso IN SELECT unnest(ARRAY[
    'hash_curto','hash_maiusculo','sem_cobrancas',
    'cobranca_repetida','cobranca_invalida','mais_dez'
  ]) LOOP
    rejeitou := false;
    h := CASE WHEN caso='hash_curto' THEN 'abc'
              WHEN caso='hash_maiusculo' THEN repeat('C',64)
              ELSE repeat('c',64) END;
    arr := CASE caso
      WHEN 'sem_cobrancas' THEN ARRAY[]::text[]
      WHEN 'cobranca_repetida' THEN ARRAY['CHAR_A','CHAR_A']
      WHEN 'cobranca_invalida' THEN ARRAY['INVALIDO']
      WHEN 'mais_dez' THEN ARRAY(SELECT 'CHAR_'||i::text FROM generate_series(1,11) i)
      ELSE ARRAY['CHAR_A']
    END;
    BEGIN
      PERFORM private.receber_webhook_sandbox(h,arr);
    EXCEPTION WHEN SQLSTATE '22023' THEN
      rejeitou := true;
    END;
    IF NOT rejeitou THEN
      RAISE EXCEPTION 'Entrada inválida aceita: %',caso;
    END IF;
  END LOOP;
END $$;
ROLLBACK;
