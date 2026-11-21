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

## Teste isolado implementado em 21/11/2026

`scripts/testar-concorrencia-pg.mjs` executa a função SQL real e as tabelas
financeiras em um PostgreSQL 17.12 descartável do GitHub Actions. Requer banco
novo em loopback com nome exato `trampofacil_concorrencia_test`; não aceita
conexão Supabase nem parâmetros de URL extras. Fixtures são confirmadas apenas
nesse banco efêmero, que é descartado com o job. Nenhum registro de projeto é apagado.

A conexão A mantém a transação aberta após registrar. A conexão B tenta o
mesmo registro; uma terceira conexão confirma em `pg_stat_activity` que B está
aguardando o advisory lock antes de liberar A. O teste exige mesmo UUID, uma
tentativa, um evento e recusa de chave diferente. Isso comprova concorrência
no PostgreSQL isolado; não substitui ensaio autenticado do serviço remoto/TLS.

Workflow: `.github/workflows/concorrencia-isolada.yml`. Consultar sua execução
antes de declarar o cenário aprovado; não há resultado presumido ou teste ignorado.

### Resultado confirmado

[Execução 44956310312](https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/44956310312)
aprovada no commit `611bf2189cd858c65d4a54a7ec51318468d5fda1`.
O log confirmou disputa pelo advisory lock entre duas conexões independentes,
mesmo UUID, uma tentativa/evento e recusa de chave divergente. O container foi
encerrado pelo job. A concorrência no PostgreSQL isolado está comprovada;
a validação autenticada do serviço remoto permanece pendente.
