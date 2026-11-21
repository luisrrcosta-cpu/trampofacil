-- Teste negativo das restrições que impedem pagamentos reais.
-- Executar SOMENTE no projeto TrampoFacil-Homologacao.
BEGIN;
DO $$
DECLARE c text;
BEGIN
  BEGIN
    INSERT INTO private.tentativas_pagamento_teste(preparacao_id,chave_idempotencia,valor_centavos,pagamento_habilitado)
    VALUES ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',10000,true);
    RAISE EXCEPTION 'FALHA: pagamento real aceito';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS c = CONSTRAINT_NAME;
    IF c <> 'tentativas_pagamento_teste_pagamento_habilitado_check' THEN RAISE; END IF;
  END;
  BEGIN
    INSERT INTO private.tentativas_pagamento_teste(preparacao_id,chave_idempotencia,valor_centavos,pago_centavos)
    VALUES ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',10000,100);
    RAISE EXCEPTION 'FALHA: valor pago aceito';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS c = CONSTRAINT_NAME;
    IF c <> 'cobranca_sem_pagamento_real' THEN RAISE; END IF;
  END;
  BEGIN
    INSERT INTO private.tentativas_pagamento_teste(preparacao_id,chave_idempotencia,valor_centavos,repasse_habilitado)
    VALUES ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',10000,true);
    RAISE EXCEPTION 'FALHA: repasse aceito';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS c = CONSTRAINT_NAME;
    IF c <> 'tentativas_pagamento_teste_repasse_habilitado_check' THEN RAISE; END IF;
  END;
END $$;
ROLLBACK;
