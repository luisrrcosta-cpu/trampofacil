# Concorrência da revisão administrativa
Teste executado e aprovado em PostgreSQL 17.12 descartável no GitHub Actions. Não acessa Supabase.
Quatro disputas com conexões independentes; pg_stat_activity precisa comprovar espera por lock antes de liberar a primeira transação.
1. Duas aprovações da mesma versão retornam a mesma decisão, com um registro.
2. Edição que chega primeiro impede aprovação da versão antiga (40001).
3. Aprovação que chega primeiro não impede edição posterior: o trigger real retira publicação.
4. Revogação que chega primeiro impede a aprovação pelo revisor (42501).

Usa os SQL de homologação para funções e trigger, sem reimplementar as regras testadas. Fixtures de perfil e RLS são reduzidas e descartáveis; o teste integrado com todas as tabelas reais continua em VALIDACAO-INTEGRADA-PAINEL-2026-11-23.md.
A URL aceita somente loopback e o banco de teste nomeado. Nenhum dado de usuário ou segredo real.

## Evidência
Workflow: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45274489598
Job: 138042611871. A etapa específica de revisão terminou com success e registrou a aprovação dos quatro cenários.
No mesmo commit, testes financeiros e testes isolados também passaram.
Os testes de concorrência rodam automaticamente na branch de desenvolvimento em cada push.
Não houve mudança no aplicativo publicado, na homologação ou na produção neste trabalho.
