-- Executar apenas na homologação; não desativa RLS nem cria cobranças.
BEGIN;
SET LOCAL ROLE anon;
DO $$
BEGIN
 BEGIN
  INSERT INTO private.tentativas_pagamento_teste(preparacao_id,chave_idempotencia,valor_centavos)
  VALUES ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1','ffffffff-ffff-4fff-8fff-fffffffffff1',10000);
  RAISE EXCEPTION 'FALHA: anon inseriu tentativa';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  PERFORM private.registrar_tentativa_inerte('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1','ffffffff-ffff-4fff-8fff-fffffffffff1');
  RAISE EXCEPTION 'FALHA: anon executou função';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
ROLLBACK;
