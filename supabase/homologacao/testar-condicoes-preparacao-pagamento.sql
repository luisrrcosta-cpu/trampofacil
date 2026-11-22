-- Testes de rejeição sem criar dados, somente homologação.
-- IDs sintéticos inexistentes; todos os casos falham antes da leitura de solicitação.
DO $$
DECLARE rejeitou boolean; caso text; v_forma text; v_parcelas int;
BEGIN
 FOR caso IN SELECT unnest(ARRAY[
  'forma_invalida','parcelas_zero','parcelas_onze','avista_duas','parcelado_uma'
 ]) LOOP
  rejeitou := false;
  v_forma := CASE
    WHEN caso='forma_invalida' THEN 'pix'
    WHEN caso IN ('avista_duas','parcelas_zero') THEN 'credito_avista'
    ELSE 'credito_parcelado' END;
  v_parcelas := CASE caso
    WHEN 'parcelas_zero' THEN 0 WHEN 'parcelas_onze' THEN 11
    WHEN 'avista_duas' THEN 2 WHEN 'parcelado_uma' THEN 1 ELSE 1 END;
  BEGIN
    PERFORM private.registrar_preparacao_pagamento(
      '00000000-0000-4000-8000-000000000001'::uuid,
      '00000000-0000-4000-8000-000000000002'::uuid,
      now(),v_forma,v_parcelas);
  EXCEPTION WHEN SQLSTATE '22023' THEN
    rejeitou := true;
  END;
  IF NOT rejeitou THEN
    RAISE EXCEPTION 'Condição inválida não rejeitada: %',caso;
  END IF;
 END LOOP;
END $$;
