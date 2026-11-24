# Revogação e decisões sucessivas de recusa — 24/11/2026

Implementação dos testes: `1a4f25b6b21d67e7fb401215525a62476312aea4`.

Novos cenários no PostgreSQL descartável, com espera por lock comprovada:
1. Recusa antes da edição: a edição do titular continua possível, preserva pausa e publicação false; a consulta privada indica perfil_alterado=true.
2. Motivos diferentes concorrentes: ambos ficam auditados, a consulta retorna o último; retornar ao motivo antigo cria nova decisão e repetir a mais recente reutiliza seu ID.
3. Revogação antes da recusa: o revisor perde a autorização mesmo que a chamada já estivesse esperando; SQLSTATE 42501 e nenhum registro criado.

Os oito cenários anteriores permanecem, totalizando onze disputas reais. A fixture não acessa Supabase; aceita apenas loopback e o banco descartável nomeado.

## Validação
- Concorrência PostgreSQL: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45513158490 — success.
- Suíte geral/interface: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45513158492 — success.
- Regressões financeiras: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45513158501 — success.

Nenhuma migração ou republicação foi necessária. Nenhum dado da homologação ou produção foi alterado nesta etapa.

O documento STATUS-ATUAL-TRAMPOFACIL.md foi consolidado para remover descrições intermediárias conflitantes. Os documentos históricos permanecem preservados.
