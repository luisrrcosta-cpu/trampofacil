# PagBank sandbox — revisão de integridade e próximos passos

Data: 22/11/2026. Projeto **TrampoFacil-Homologacao** (`asdszqtpydiowgerxwee`), branch `codex/v16-seguranca-integracoes`.

## Confirmado diretamente no banco

- `private.checkouts_pagbank_sandbox`: RLS ativo, sem acesso de leitura/inserção a `anon` e `authenticated`.
- Checkout tem `UNIQUE (preparacao_id)`, `UNIQUE (referencia)` e `UNIQUE (checkout_id)`.
- CHECK exige `ambiente='sandbox'`, `pagamento_real_habilitado=false` e `repasse_habilitado=false`.
- `private.recebimentos_webhook_sandbox`: RLS ativo, sem leitura/inserção por `anon` e `authenticated`.
- Webhook tem `PRIMARY KEY (hash_sha256)`, estado fixo `aguardando_conferencia` e `financeiro_processado=false`.
- `private.receber_webhook_sandbox`: SECURITY INVOKER, execução exclusiva por `service_role`. Teste transacional de repetição idêntica, divergência e hash inválido passou; `ROLLBACK` preservou tabela vazia.

## Limites do que foi comprovado

A função SQL valida **formato, unicidade e repetição**, não comprova que a notificação veio do PagBank. Um SHA-256 válido pode ter sido calculado por qualquer origem. **Não utilizar somente esse hash como autenticação do emissor**. Não há evidência aqui de validação de assinatura/cabeçalhos ou consulta confirmatória à API oficial do provedor. Não inferir liquidação, estorno ou repasse a partir de notificação não autenticada.

## Próximas etapas, sem pagamentos reais

1. Revisar o contrato atual de autenticação de webhooks na documentação oficial do PagBank para a integração selecionada; não inventar cabeçalhos ou assinatura.
2. Implementar verificação do emissor no servidor, usando segredo de homologação protegido e validação de payload bruto quando aplicável.
3. Validar origem e estado da cobrança por consulta ao PagBank **sandbox**, caso exigido pelo contrato oficial.
4. Testar assinatura inválida, payload adulterado, duplicado, reordenação e indisponibilidade do provedor, sem produzir efeitos financeiros.
5. Confirmar testes de concorrência em conexões reais e a suíte completa do GitHub Actions.
6. Implantar exclusivamente em homologação depois das verificações; produção e pagamentos reais fora do escopo.

## Alertas do Supabase Advisor

- `auth_leaked_password_protection`: proteção contra senhas vazadas desativada (WARN). Requer ajuste de configuração de Auth, não tratado como mudança automática.
- `rls_enabled_no_policy` em tabelas `private`: pode ser deliberado para isolamento; não adicionar políticas públicas sem necessidade.
- `auth_rls_initplan` em `public.clientes`, `public.profissionais`, `public.solicitacoes`: recomendações de desempenho; verificar equivalência semântica antes de modificar.

Esta revisão é documental e somente leitura. Nenhum pagamento, repasse, deploy ou alteração de produção foi realizado.
