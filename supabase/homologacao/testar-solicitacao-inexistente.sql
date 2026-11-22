-- Teste seguro de contratação inexistente, sem alterações persistentes.
-- Execute exclusivamente em homologação.
DO $$
DECLARE v_rejeitou boolean := false;
BEGIN
  BEGIN
    PERFORM private.registrar_preparacao_pagamento(
      '00000000-0000-4000-8000-000000000001'::uuid,
      '00000000-0000-4000-8000-000000000002'::uuid,
      now(),'credito_avista',1);
  EXCEPTION WHEN SQLSTATE 'P0002' THEN
    v_rejeitou := true;
  END;
  IF NOT v_rejeitou THEN
    RAISE EXCEPTION 'Solicitação inexistente não rejeitada';
  END IF;
END $$;
