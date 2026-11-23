# Concorrência da revisão administrativa
Teste preparado para PostgreSQL 17.12 descartável no GitHub Actions. Não acessa Supabase.
Quatro disputas com conexões independentes; pg_stat_activity precisa comprovar espera por lock antes de liberar a primeira transação.
1. Duas aprovações da mesma versão retornam a mesma decisão, com um registro.
2. Edição que chega primeiro impede aprovação da versão antiga (40001).
3. Aprovação que chega primeiro não impede edição posterior: o trigger real retira publicação.
4. Revogação que chega primeiro impede a aprovação pelo revisor (42501).

Usa os SQL de homologação para funções e trigger, sem reimplementar as regras testadas. Fixtures de perfil e RLS são reduzidas e descartáveis; o teste integrado com todas as tabelas reais continua em VALIDACAO-INTEGRADA-PAINEL-2026-11-23.md.
A URL aceita somente loopback e o banco de teste nomeado. Nenhum dado de usuário ou segredo real.
