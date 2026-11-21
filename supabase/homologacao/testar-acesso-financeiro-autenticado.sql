-- Teste reversível: usuário autenticado não acessa operação financeira privada.
-- Executar SOMENTE em TrampoFacil-Homologacao, com executor administrativo.
-- Não modifica políticas nem ativa pagamentos. A transação é revertida.
BEGIN;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
 BEGIN
  PERFORM private.registrar_tentativa_inerte(
   'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1'::uuid,
   'ffffffff-ffff-4fff-8fff-fffffffffff1'::uuid
  );
  RAISE EXCEPTION 'FALHA: authenticated executou função financeira privada';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  PERFORM count(*) FROM private.preparacoes_pagamento;
  RAISE EXCEPTION 'FALHA: authenticated leu preparações privadas';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  PERFORM count(*) FROM private.tentativas_pagamento_teste;
  RAISE EXCEPTION 'FALHA: authenticated leu tentativas privadas';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
ROLLBACK;
