-- Regressão de privilégios: a conta interna não pode alterar ou apagar registros financeiros.
-- Somente TrampoFacil-Homologacao. Teste sem dados reais e sem pagamentos.
BEGIN;
SET LOCAL ROLE service_role;
DO $$
BEGIN
 BEGIN
  UPDATE private.tentativas_pagamento_teste SET valor_centavos=10000 WHERE false;
  RAISE EXCEPTION 'FALHA: service_role pode editar tentativa';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  DELETE FROM private.tentativas_pagamento_teste WHERE false;
  RAISE EXCEPTION 'FALHA: service_role pode apagar tentativa';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  UPDATE private.preparacoes_pagamento SET pagamento_habilitado=true WHERE false;
  RAISE EXCEPTION 'FALHA: service_role pode ativar pagamento';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
ROLLBACK;
