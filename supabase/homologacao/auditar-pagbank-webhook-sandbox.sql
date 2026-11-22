-- Auditoria somente leitura do fluxo PagBank sandbox e webhook.
-- Executar exclusivamente em TrampoFacil-Homologacao.
-- Não cria cobrança, não modifica tabelas, funções ou políticas.
WITH tabelas AS (
  SELECT c.relname AS objeto,
         c.relrowsecurity AS rls_ativo,
         has_table_privilege('anon',c.oid,'SELECT') AS anon_leitura,
         has_table_privilege('authenticated',c.oid,'SELECT') AS autenticado_leitura,
         has_table_privilege('anon',c.oid,'INSERT') AS anon_insercao,
         has_table_privilege('authenticated',c.oid,'INSERT') AS autenticado_insercao
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='private'
    AND c.relname IN ('checkouts_pagbank_sandbox','recebimentos_webhook_sandbox')
)
SELECT objeto,rls_ativo,anon_leitura,autenticado_leitura,anon_insercao,autenticado_insercao
FROM tabelas ORDER BY objeto;

SELECT p.proname AS funcao,p.prosecdef AS security_definer,
       has_function_privilege('anon',p.oid,'EXECUTE') AS anon_executa,
       has_function_privilege('authenticated',p.oid,'EXECUTE') AS autenticado_executa,
       has_function_privilege('service_role',p.oid,'EXECUTE') AS servico_executa
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='private' AND p.proname='receber_webhook_sandbox';
