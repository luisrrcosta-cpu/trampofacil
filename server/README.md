# Preparação interna de pagamentos — somente testes

`preparar-pagamento.js` é lógica interna para um futuro endpoint de homologação.
Não é um servidor HTTP, não está publicado, não contém credenciais e não se
conecta ao Supabase ou ao PagBank por conta própria. Os testes usam adaptadores
simulados. Não importar este arquivo nos scripts públicos do aplicativo.

O preparador recebe dois adaptadores confiáveis: `autenticar(token)`, que deve
validar o token com o serviço de autenticação e retornar a identidade confirmada
e `isAnonymous: false`, e `consultarSolicitacao`, que deve consultar o orçamento
salvo pelo servidor, com autorização. Nunca decodificar o JWT sem verificar,
nem usar a identidade ou os dados de orçamento fornecidos pelo navegador.

O cliente envia somente `solicitacaoId`, `forma` e `parcelas`. O valor vem do
orçamento salvo; apenas o cliente titular pode preparar uma solicitação no
estado `aceita`. Nenhum link, cobrança, transferência ou marcação como pago
é produzido. O resultado sempre traz `pagamentoHabilitado: false` e a lista
de pendências. Não existe método de cobrança que possa ser ativado por uma flag.

O resultado identifica a versão do orçamento por `atualizado_em`, mas não reserva
nem bloqueia o registro. A implementação futura deve conferir essa versão em
uma operação atômica ao criar a tentativa de pagamento. A repetição desta função
é somente leitura e **não implementa** idempotência financeira persistente.

## Próximas etapas, antes de habilitar qualquer cobrança

1. Selecionar um projeto Supabase de homologação e implementar os adaptadores
   reais de autenticação/consulta. Não usar produção para os testes.
2. Confirmar taxas online, tarifas fixas, impostos e regras de parcelamento;
   apresentar o preço total ao cliente e registrar seu aceite antes da cobrança.
3. Definir a divisão e os repasses. Checkout simples e divisão automática não
   devem ser tratados como equivalentes; confirmar a habilitação do modelo de
   marketplace e as condições da conta junto ao PagBank.
4. Criar persistência das tentativas, com idempotência por contratação/versão,
   proteção contra concorrência e bloqueio de pagamento duplicado.
5. Adicionar credencial de sandbox apenas ao ambiente do servidor. Implementar
   o adaptador PagBank e validar seus erros, expiração e respostas incertas.
6. Validar notificações de pagamento, autenticar/verificar a origem e consultar
   o estado no provedor antes de marcar como pago. O retorno do navegador não é
   prova de pagamento. Testar notificações repetidas e fora de ordem, estorno,
   cancelamento e conciliação, sem dinheiro real.

Documentação consultada em 19/11/2026:

- https://developer.pagbank.com.br/docs/checkout
- https://developer.pagbank.com.br/reference/criar-checkout

A API de criação de checkout documenta o endpoint de sandbox
`https://sandbox.api.pagseguro.com/checkouts`. Nenhuma chamada a esse endpoint
é feita nesta entrega. As taxas de maquininha do simulador continuam sem efeito
em uma cobrança online.
