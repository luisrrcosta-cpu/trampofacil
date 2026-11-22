-- Auditoria somente leitura: privilégios das funções financeiras em homologação.
-- Falha se alguma função estiver exposta a anon/authenticated, usar SECURITY DEFINER
-- ou não permitir execução por service_role. Não modifica dados ou permissões.
DO $$
DECLARE
  v_nome text;
  v_oid oid;
BEGIN
  FOREACH v_nome IN ARRAY ARRAY[
    'receber_webhook_sandbox(text,text[])',
    'registrar_preparacao_pagamento(uuid,uuid,timestamptz,text,integer)',
    'registrar_tentativa_inerte(uuid,uuid)'
  ] LOOP
    v_oid := to_regprocedure('private.' || v_nome);
    IF v_oid IS NULL THEN
      RAISE EXCEPTION 'Função financeira ausente: %', v_nome;
    END IF;
    IF (SELECT prosecdef FROM pg_proc WHERE oid=v_oid) THEN
      RAISE EXCEPTION 'SECURITY DEFINER proibido na função financeira: %', v_nome;
    END IF;
    IF has_function_privilege('anon',v_oid,'EXECUTE') OR
       has_function_privilege('authenticated',v_oid,'EXECUTE') OR
       NOT has_function_privilege('service_role',v_oid,'EXECUTE') THEN
      RAISE EXCEPTION 'Privilégios inseguros na função financeira: %', v_nome;
    END IF;
  END LOOP;
END $$;
