-- Auditoria somente leitura dos cálculos da preparação financeira.
-- O cálculo replica a função registrar_preparacao_pagamento.
DO $$
DECLARE v_total bigint; v_comissao bigint; v_profissional bigint;
BEGIN
  FOR v_total IN SELECT unnest(ARRAY[100,101,104,105,109,15000,100000000]::bigint[]) LOOP
    v_comissao := (v_total + 5) / 10;
    v_profissional := v_total - v_comissao;
    IF v_comissao + v_profissional <> v_total
       OR v_comissao < 0 OR v_profissional < 0 THEN
      RAISE EXCEPTION 'Divisão financeira inválida: %',v_total;
    END IF;
  END LOOP;
END $$;
