-- Auditoria somente leitura: tabelas financeiras privadas da homologação.
-- Falha se faltar RLS ou se anon/authenticated tiverem privilégios diretos.
DO $$
DECLARE
  v_nome text;
  v_oid oid;
BEGIN
  FOREACH v_nome IN ARRAY ARRAY[
    'checkouts_pagbank_sandbox',
    'recebimentos_webhook_sandbox',
    'preparacoes_pagamento',
    'tentativas_pagamento_teste',
    'eventos_tentativa_pagamento_teste'
  ] LOOP
    v_oid := to_regclass('private.' || v_nome);
    IF v_oid IS NULL THEN
      RAISE EXCEPTION 'Tabela financeira ausente: %', v_nome;
    END IF;
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid=v_oid) THEN
      RAISE EXCEPTION 'RLS desativado: %', v_nome;
    END IF;
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='private' AND tablename=v_nome
        AND (
          'public'=ANY(roles)
          OR (
            ('anon'=ANY(roles) OR 'authenticated'=ANY(roles))
            AND (
              COALESCE(qual,'') NOT IN ('false','(false)')
              OR (cmd IN ('ALL','INSERT','UPDATE') AND COALESCE(with_check,'') NOT IN ('false','(false)'))
            )
          )
        )
      )
    ) THEN
      RAISE EXCEPTION 'Política RLS pública permissiva: %', v_nome;
    END IF;
    IF has_table_privilege('anon',v_oid,'SELECT, INSERT, UPDATE, DELETE')
       OR has_table_privilege('authenticated',v_oid,'SELECT, INSERT, UPDATE, DELETE') THEN
      RAISE EXCEPTION 'Permissão pública indevida: %', v_nome;
    END IF;
  END LOOP;
END $$;
