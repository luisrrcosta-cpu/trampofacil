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
