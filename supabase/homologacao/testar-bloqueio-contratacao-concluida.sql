-- Teste sem alteração persistente: contratação concluída não pode iniciar pagamento.
-- Executar somente em homologação, quando existir solicitação concluída.
DO $$
DECLARE s record; rejeitou boolean := false;
BEGIN
  SELECT id,cliente_usuario_id,atualizado_em INTO s
  FROM public.solicitacoes WHERE status='concluida' LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nenhuma solicitação concluída para testar';
  END IF;
  BEGIN
    PERFORM private.registrar_preparacao_pagamento(
      s.id,s.cliente_usuario_id,s.atualizado_em,'credito_avista',1);
  EXCEPTION WHEN SQLSTATE '22023' THEN
    rejeitou := true;
  END;
  IF NOT rejeitou THEN
    RAISE EXCEPTION 'Solicitação concluída foi aceita indevidamente';
  END IF;
END $$;
