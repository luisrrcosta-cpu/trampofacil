-- Auditoria somente leitura. Executar exclusivamente em TrampoFacil-Homologacao.
-- A consulta retorna false em qualquer proteção ausente; não modifica dados.
select
  current_database() as banco,
  (select count(*)=2 from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='private' and c.relname in
   ('tentativas_pagamento_teste','eventos_tentativa_pagamento_teste')
   and c.relrowsecurity) as rls_ambas_tabelas,
  not has_function_privilege('anon','private.registrar_tentativa_inerte(uuid,uuid)','EXECUTE') as anon_bloqueado,
  not has_function_privilege('authenticated','private.registrar_tentativa_inerte(uuid,uuid)','EXECUTE') as autenticado_bloqueado,
  has_function_privilege('service_role','private.registrar_tentativa_inerte(uuid,uuid)','EXECUTE') as servico_autorizado,
  (select not p.prosecdef from pg_proc p where p.oid='private.registrar_tentativa_inerte(uuid,uuid)'::regprocedure) as funcao_sem_security_definer,
  exists(select 1 from pg_indexes where schemaname='private'
    and tablename='tentativas_pagamento_teste'
    and indexname='tentativas_unicas_por_preparacao_teste'
    and indexdef like 'CREATE UNIQUE INDEX%') as unica_por_preparacao,
  exists(select 1 from pg_indexes where schemaname='private'
    and tablename='tentativas_pagamento_teste'
    and indexname='tentativas_pagamento_teste_chave_idempotencia_key'
    and indexdef like 'CREATE UNIQUE INDEX%') as chave_idempotencia_unica,
  (pg_get_functiondef('private.registrar_tentativa_inerte(uuid,uuid)'::regprocedure)
    like '%Contratação alterada ou indisponível%') as verifica_contratacao_atual,
  (select count(*)=2 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='private' and c.relname in ('tentativas_pagamento_teste','eventos_tentativa_pagamento_teste') and not has_table_privilege('anon',c.oid,'SELECT') and not has_table_privilege('anon',c.oid,'INSERT') and not has_table_privilege('authenticated',c.oid,'SELECT') and not has_table_privilege('authenticated',c.oid,'INSERT') and has_table_privilege('service_role',c.oid,'INSERT')) as acesso_tabelas_restrito,
  (select count(*)=2 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='private' and c.relname in ('tentativas_pagamento_teste','eventos_tentativa_pagamento_teste')
    and not has_table_privilege('anon',c.oid,'UPDATE,DELETE')
    and not has_table_privilege('authenticated',c.oid,'UPDATE,DELETE')
    and not has_table_privilege('service_role',c.oid,'UPDATE,DELETE')) as alteracao_exclusao_bloqueadas,
  (select count(*)=4 from pg_constraint k where k.conrelid='private.tentativas_pagamento_teste'::regclass
    and k.conname in ('cobranca_sem_pagamento_real','tentativas_pagamento_teste_ambiente_check',
      'tentativas_pagamento_teste_pagamento_habilitado_check','tentativas_pagamento_teste_repasse_habilitado_check')) as restricoes_sandbox_presentes,
  (select count(*) from private.tentativas_pagamento_teste) as tentativas_registradas,
  (select count(*) from private.eventos_tentativa_pagamento_teste) as eventos_registrados;
