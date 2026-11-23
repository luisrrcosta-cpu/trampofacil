# Última orientação de ajuste — correção
Cenário reproduzido: revisor pede detalhamento, depois revisão da cidade e então detalhamento novamente. A implementação original reutilizava o primeiro evento de detalhamento, enquanto a consulta do profissional continuava exibindo a orientação de cidade.
Correção: reutilizar apenas o evento mais recente da solicitação quando motivo e versão coincidirem. Uma orientação diferente gera novo evento. Repetir a última ação continua idempotente.
Não altera grants, assinatura, verificações de revisor, snapshot, locks, perfil ou publicação.
Teste de regressão falhou antes da correção e deve passar após ultima_orientacao_ajuste.sql. Aplicação deve ser registrada após CI.

## Validação e aplicação confirmadas
Regressão reproduzida antes e aprovada depois da correção.
CI completo: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45284903243 — sucesso; concorrência e finanças também passaram.
Migração ultima_orientacao_ajuste aplicada somente em asdszqtpydiowgerxwee.
Script integrado ampliado e executado em BEGIN/ROLLBACK com papéis reais e claims simuladas; alternância de motivos e repetição final passaram.
Conferência: zero orientações, aprovações e identidades QA persistidas; leitura direta privada e execução anônima continuam bloqueadas.
Não houve mudança de interface, grants ou produção; publicação do site não foi necessária.
Advisors continuam com oito INFO de tabelas privadas sem políticas por negação padrão e aviso anterior de proteção de senhas.
Referências: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
