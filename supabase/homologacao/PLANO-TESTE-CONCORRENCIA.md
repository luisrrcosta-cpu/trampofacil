# Validação de concorrência financeira — homologação

## Estado observado em 21/11/2026

- Preparações de pagamento de teste disponíveis: **0**.
- Solicitações aceitas: **0**.
- Tentativas financeiras: **0**.
- A função `private.registrar_tentativa_inerte(uuid,uuid)` usa bloqueio transacional por preparação e índices únicos.
- Dois comandos SQL em sessões diferentes foram executados, mas **não houve disputa comprovada pelo mesmo bloqueio**.

## Teste pendente (não declarar aprovado)

1. Preparar uma contratação **sintética e isolada**, somente em homologação, sem dados de clientes reais.
2. Garantir que o registro sintético possa ser descartado por **ROLLBACK**, sem apagar registros existentes.
3. Abrir duas conexões PostgreSQL independentes e sincronizar ambas para registrar a mesma preparação com a mesma chave.
4. Verificar que ambas recebem o **mesmo UUID** e que há exatamente **uma tentativa e um evento**.
5. Repetir com chave diferente e exigir rejeição sem registro adicional.
6. Confirmar que o banco continua sem cobranças, repasses e efeitos permanentes.

**Atenção:** fixtures criadas em transações independentes não ficam visíveis entre conexões antes do commit. Não criar dados persistentes nem executar limpeza destrutiva para contornar essa limitação. Se não houver mecanismo de isolamento apropriado, manter o teste pendente.

Não usar produção, não desativar RLS, não habilitar PagBank real.
