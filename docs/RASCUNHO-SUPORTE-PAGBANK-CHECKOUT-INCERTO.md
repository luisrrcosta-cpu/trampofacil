# Rascunho para suporte PagBank — checkout de sandbox sem resposta confirmada
Preparado em 24/11/2026. Não enviado. Não incluir senha, token, CPF, CNPJ, cartão ou código de acesso.

## Texto para encaminhar
Olá, equipe de integração PagBank.

Estamos validando exclusivamente o Checkout hospedado no sandbox. Uma única chamada de criação não teve o resultado confirmado pela aplicação. Preservamos a tentativa como incerta e não repetimos o POST.

Dados para localização:
- Produto: Checkout hospedado PagBank.
- Ambiente: sandbox.
- Operação: POST https://sandbox.api.pagseguro.com/checkouts.
- Momento do registro da tentativa: 24/11/2026 às 22:18:04, horário de Brasília (25/11/2026 01:18:04 UTC). O timestamp corresponde ao registro local imediatamente anterior à chamada, não a um recibo do provedor.
- reference_id: tf-sandbox-89934739-87f9-4c53-b8ca-8b757dd81f53.
- Valor do item: 100 centavos (R$ 1,00), quantidade 1.
- Identificador interno do item: 89934739-87f9-4c53-b8ca-8b757dd81f53.
- Sem cliente pré-preenchido, frete, recorrência, desconto ou acréscimo; cartão de crédito em uma parcela.
- A aplicação não armazenou CHEC_id nem link confirmado. Não houve envio de cartão ou confirmação de pagamento pelo nosso fluxo.
- A tentativa permanece bloqueada contra reenvio. Não ativar cobrança, pagamento ou repasse de produção.

Pedimos:
1. Confirmar se foi criado algum checkout para essa referência e janela de horário. Caso exista, informar o CHEC_id, estado e horário de criação.
2. Se não houver criação, informar a evidência de rejeição ou falha disponível. Uma busca sem resultado isolada não será tratada como autorização automática para reenviar.
3. Informar se este produto possui consulta documentada por reference_id e quais são as regras específicas de idempotência para POST /checkouts.
4. Confirmar qual método de assinatura de payment_notification_urls é usado atualmente por este produto no sandbox: x-payload-signature/ECDSA ou x-authenticity-token/SHA-256. Não implementaremos fallback automático entre os dois.
5. O acesso pelo endereço de sandbox redirecionou ao login e voltou à tela inicial após entrada, sem mensagem de erro explícita. Orientar a forma correta de acessar o painel da conta vinculada à integração, sem alterar credenciais.

Precisamos somente da conferência técnica desta tentativa de teste. Não solicitamos novo checkout, pagamento, ativação em produção ou movimentação financeira.

## Evidências locais
- Preparação existente: 88cecf6d-cf3b-4112-a8ca-9a33d767a58e.
- Antes/depois da consulta autenticada: uma tentativa, estado incerto, pagamento_real_habilitado=false, repasse_habilitado=false.
- Consulta local autenticada mostra o mesmo estado e bloqueia novo envio.
- Os logs da primeira chamada não continham código HTTP do provedor ou categoria de falha; não é possível atribuir a causa com segurança. Diagnóstico mínimo foi acrescentado posteriormente; não recupera retroativamente a resposta perdida.
- Não há prova de compatibilidade ponta a ponta com checkout/notificação autênticos.

## Fontes oficiais consultadas
- https://developer.pagbank.com.br/reference/consultar-checkout — consulta exige checkout_id.
- https://developer.pagbank.com.br/reference/criar-checkout — criação e referência interna.
- https://developer.pagbank.com.br/docs/chaves-publicas-e-de-idempotencia — orientação geral; não comprova suporte/retenção para este endpoint específico.
- https://developer.pagbank.com.br/reference/webhooks-checkout — validar método aplicável ao produto antes de habilitar processamento.

## Como usar a resposta
Se o suporte fornecer CHEC_id, conferir via adaptador somente leitura e validar referência/valor. Não atualizar manualmente o banco como pago nem apagar o claim. Se informar rejeição, avaliar evidências e preparar procedimento separado antes de qualquer novo POST. Registrar a resposta técnica sem credenciais ou dados pessoais.
