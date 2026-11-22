# PagBank — bloqueios para integração de notificações (homologação)

Estado em 2026-11-22: **não implantar rota pública, não habilitar pagamento real nem repasses**.

## Já implementado no código interno
- Dois validadores isolados: `x-authenticity-token` (SHA-256) e `x-payload-signature` (ECDSA).
- Escolha explícita e exclusiva de `modeloAssinatura`; sem fallback.
- Assinatura sobre o corpo bruto, com limite de 256 KiB; rejeição de cabeçalhos misturados.
- Consulta de cobrança no sandbox antes de interpretar estado financeiro.
- Valores esperados e ID da cobrança fornecidos pelo contexto autenticado, não pelo webhook.
- Resultado `liberarRepasse:false` em todos os caminhos; nenhuma escrita financeira.
- Testes automatizados no repositório e workflow `testes-financeiros.yml`.

## Antes de ligar o webhook
1. Confirmar **qual produto e endpoint PagBank** será usado no Checkout do TrampoFácil e seu método de autenticação na documentação oficial aplicável.
2. Capturar exemplo **real de notificação de sandbox** (sem segredos) e validar o caminho do ID da cobrança. O módulo atual exige `mensagem.id`, ainda **não confirmado** como formato do produto.
3. Executar `npm test` e confirmar resultado no GitHub Actions para a branch de desenvolvimento.
4. Confirmar credenciais de sandbox armazenadas como segredos do servidor, nunca no cliente ou repositório.
5. Implementar autenticação/autorização de contexto pelo banco, idempotência e logs sem dados sensíveis, sob revisão separada.
6. Validar retries, duplicidades, cobranças divergentes, cancelamentos, estornos e concorrência em homologação.
7. Obter autorização explícita antes de qualquer implantação ou mudança fora da branch e projeto de homologação.

**Não confundir:** um teste com chaves fictícias demonstra comportamento do código, não prova compatibilidade com notificações reais do PagBank. Nenhuma resposta de webhook deve liberar repasse automaticamente.

## Evidência oficial sobre eventos do Checkout
- A documentação de Checkout informa notificações **transacionais** e notificações de **checkout**. Eventos de checkout como `EXPIRED` podem conter `id: CHEC_...`; não equivalem a confirmação de pagamento.
- A documentação de webhooks também identifica `x-product-origin: CHECKOUT` e `x-product-id: CHEC_...`. Esses cabeçalhos não substituem autenticação criptográfica.
- O pipeline atual de cobrança espera `id: CHAR_...` e rejeita `CHEC_...` sem consultar o provedor; o processamento de eventos de checkout exige fluxo separado e revisão posterior.
- O guia de Checkout aponta para a validação SHA-256 do cabeçalho `x-authenticity-token`; há documentação geral mais nova de ECDSA com `x-payload-signature`. O método precisa ser confirmado no produto/ambiente real, **sem fallback automático**.
- Fontes: https://developer.pagbank.com.br/reference/webhooks-checkout ; https://developer.pagbank.com.br/reference/webhooks ; https://developer.pagbank.com.br/reference/confirmar-autenticidade-da-notificacao ; https://developer.pagbank.com.br/reference/validacao-de-autenticidade

## URLs distintas no Checkout
A referência oficial de **Criar Checkout** distingue `notification_urls` (alterações de estado do checkout) de `payment_notification_urls` (alterações de estado do pagamento). A configuração futura deverá usar `payment_notification_urls` para o pipeline transacional e tratar `notification_urls` separadamente, se necessário. Não usar um evento `CHEC_` para confirmar um pagamento.
Fonte: https://developer.pagbank.com.br/reference/criar-checkout e https://developer.pagbank.com.br/reference/objeto-checkout

## Execução da suíte
O workflow `.github/workflows/testes-financeiros.yml` é acionado por push na branch de desenvolvimento, mas **a conclusão verde do GitHub Actions não foi confirmada**. Os testes adicionados no repositório não devem ser descritos como aprovados até a verificação da execução. 

## Limites da validação de URLs (revisão de segurança)
A função `validarNotificacoesCheckoutSandbox` valida apenas a **forma da URL** (HTTPS, endereço não local e separação dos tipos de notificação). **Ela não faz resolução DNS, não garante que o domínio pertença ao projeto e não protege, sozinha, contra DNS rebinding ou redirecionamentos HTTP.** Antes de efetuar qualquer requisição de saída, exigir destinos previamente aprovados, resolver e verificar IPs no momento da conexão e desabilitar redirecionamentos automáticos. Esta validação **não é uma autorização para chamar URLs fornecidas pelo cliente**.

### Evidência local
Em 22/11/2026, a execução local com Node.js 22 de `tests/configuracao-checkout-sandbox.test.js` e `tests/conferencia-pagbank.test.js` terminou com **8 testes aprovados e 0 falhas**. Não equivale à execução da suíte integral ou do GitHub Actions. A consulta de status do commit `48e1feb0ab58486ae057b4b7bf9fcc6c2d978526` não retornou verificações; isso **não comprova** que o workflow foi executado.

### Reexecução local em 22/11/2026
Foi reconstruído localmente o conteúdo atual dos arquivos `server/configuracao-checkout-sandbox.js` e `tests/configuracao-checkout-sandbox.test.js` e executado `node --test tests/configuracao-checkout-sandbox.test.js` no Node.js. **Resultado observado: 6 testes aprovados, 0 falhas, 0 ignorados**. Isso cobre apenas esse módulo e **não** equivale a um checkout completo do repositório nem à aprovação do GitHub Actions.
