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
