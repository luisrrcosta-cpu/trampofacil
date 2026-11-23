# Última orientação de ajuste — correção
Cenário reproduzido: revisor pede detalhamento, depois revisão da cidade e então detalhamento novamente. A implementação original reutilizava o primeiro evento de detalhamento, enquanto a consulta do profissional continuava exibindo a orientação de cidade.
Correção: reutilizar apenas o evento mais recente da solicitação quando motivo e versão coincidirem. Uma orientação diferente gera novo evento. Repetir a última ação continua idempotente.
Não altera grants, assinatura, verificações de revisor, snapshot, locks, perfil ou publicação.
Teste de regressão falhou antes da correção e deve passar após ultima_orientacao_ajuste.sql. Aplicação deve ser registrada após CI.
