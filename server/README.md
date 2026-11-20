# Preparação de pagamentos — somente homologação

O serviço `preparar-pagamento-teste` está publicado exclusivamente no projeto
`TrampoFacil-Homologacao` (`asdszqtpydiowgerxwee`). Não há operação de cobrança,
checkout, transferência, webhook ou marcação como pago. O código está em
`supabase/functions/preparar-pagamento-teste/index.ts` e `server/edge-homologacao.js`.

## Fluxo do serviço

1. O handler confere rota, método, origem, tipo JSON, limite de 4 KiB e prazo
   de leitura de 5 segundos.
2. O preparador exige Bearer token, valida a identidade em `/auth/v1/user` e
   recusa conta anônima ou e-mail não confirmado.
3. A solicitação é consultada na Data API com o JWT do próprio cliente,
   preservando RLS. Só o cliente titular de um orçamento aceito pode preparar.
4. A conexão de banco é aberta apenas após essas verificações. A transação
   assume o papel `service_role` e chama a função privada com parâmetros,
   fornecendo a identidade validada pelo Auth, nunca pelo corpo HTTP.
5. A função privada bloqueia o pedido, confere novamente a versão e o valor
   salvo e registra ou recupera a preparação única. O resultado HTTP sempre
   mantém `pagamentoHabilitado: false`.

O corpo HTTP aceita somente `solicitacaoId`, `forma` e `parcelas`. Valor,
comissão, identidade, versão, status, flags de habilitação e SQL não são
aceitos do navegador. A divisão-base é 90/10 antes de impostos; nenhum total
com taxas online é calculado para cobrança.

O gateway da Edge Function usa `verify_jwt: false` porque a autenticação é
realizada obrigatoriamente no próprio serviço via Auth, sem decodificação local
não verificada. Isso também permite o preflight OPTIONS. POST sem sessão válida
é recusado antes de consultar o pedido ou abrir o banco. Não usar a chave
publicável como se fosse token de uma pessoa.

## Conexão e exposição

O ambiente fornece `SUPABASE_URL` e `SUPABASE_DB_URL` automaticamente. A URL
pública precisa coincidir exatamente com o projeto de homologação. A conexão
aceita somente seu host direto ou pooler oficial com o usuário desse projeto,
sem parâmetros extras. A credencial permanece apenas no ambiente do servidor;
não imprimir a URL, opções de conexão ou erros internos.

O driver `postgres` está fixado em `4.1.1`. São usados TLS com validação de
certificado, uma conexão por instância, prepared statements desativados e
limites de conexão, espera, consulta e bloqueio. Não desativar TLS para
contornar falhas. Os valores SQL são parâmetros de tagged templates.

A rota externa é `/functions/v1/preparar-pagamento-teste`; caminhos extras e
query strings são recusados. Não existe rota de cobrança ou de SQL arbitrário.
As respostas usam Cache-Control no-store e nosniff. CORS aceita apenas uma origem
HTTPS explícita, sem wildcard. Sem hospedagem de interface definida,
a origem permitida é a própria API. Uma futura interface separada exigirá
configurar `TRAMPOFACIL_ORIGEM_HOMOLOGACAO` no servidor e validar a integração.
`pagamentos.js` agora integra a chamada na interface; o login por e-mail
continua bloqueado até homologação. O código prepara CORS para a origem privada
registrada em `supabase/homologacao/site.json`. A publicação dessa nova origem
no serviço está pendente: em 20/11/2026 o conector Supabase recusou acesso até
para ler o projeto. O serviço remoto não foi modificado nessa etapa.

## Persistência privada

As migrações `registrar_preparacao_pagamento_teste` e
`negar_acesso_publico_preparacoes` foram aplicadas somente na homologação.
`private.preparacoes_pagamento` tem RLS e bloqueio explícito para anon e
authenticated. O schema não é exposto na Data API. A tabela não armazena cartão,
CPF, credencial de provedor ou mensagens.

`private.registrar_preparacao_pagamento` é SECURITY INVOKER, tem search_path
vazio e execução restrita ao papel de serviço. Não criar wrapper público nem
expor private para facilitar a chamada. A função usa FOR UPDATE no pedido,
confere estado aceita e versão exata do orçamento e lê o valor salvo.
A restrição única é por solicitação/versão. Mesmas condições retornam o mesmo
ID; outra forma, parcelas, versão, cliente ou pedido encerrado são recusados.

As linhas têm `ambiente = teste`, `estado = preparada` e
`pagamento_habilitado = false`, protegidos por constraints. O papel de serviço
tem SELECT/INSERT, sem UPDATE/DELETE/TRUNCATE nessa tabela.

O adaptador `registrarPreparacao` é opcional na lógica pura do preparador,
mas é conectado à transação SQL na composição Edge. Conflitos exigem atualizar
a solicitação. Uma resposta incerta retorna erro sem repetição automática;
uma chamada posterior com as mesmas condições recupera o mesmo registro.

`preparacaoRegistrada` indica somente o registro interno. A pendência
`PERSISTENCIA_IDEMPOTENTE` continua referente às futuras tentativas financeiras.
O registro não reserva saldo nem garante cobrança única em um provedor.
Antes de uma futura tentativa financeira é necessário conferir estado/versão
novamente e coordenar a operação atômica com a idempotência do provedor.

## Verificação e limites

- `npm run test:local`: testes isolados de regras, handler, adaptadores e SQL.
- `tests/edge.test.js`: sete testes da composição HTTP com Auth/Data API
  simulados e PostgreSQL local via PGlite. A transação executa a função SQL real
  usando uma interface de driver emulada. Inclui resposta perdida após commit,
  repetição, alteração do pedido entre leitura e gravação, rejeição de origem,
  sessão e conexão indevida. Não valida TCP/TLS do driver no ambiente remoto.
- `supabase/homologacao/validar-preparacao.sql`: passou no PostgreSQL real com
  contas fictícias, fluxo completo e rollback integral.
- `npm run test:servico`: passou contra o endpoint publicado, recusando sessão
  ausente/inválida, origem externa, GET e corpo excessivo, e aceitando preflight.
  Não cria contas, não envia e-mails e não executa chamada autenticada.

Ainda falta um teste autenticado completo no serviço publicado, incluindo a
conexão real de banco/TLS e a gravação com uma conta de teste do Auth. O login
e a entrega dos códigos de e-mail não foram liberados. Concorrência entre
múltiplas conexões e falhas reais de rede também precisam de homologação antes
das tentativas financeiras. A versão publicada e o Supabase de produção não
foram alterados.

## Antes de habilitar qualquer cobrança

1. Homologar login, conta de teste e fluxo autenticado HTTP/SQL.
2. Confirmar taxas online, tarifas fixas, impostos e parcelamento e apresentar
   o total ao cliente com aceite registrado. As referências de maquininha
   (4% à vista, 12% total parcelado) não configuram checkout online.
3. Confirmar o modelo de divisão e repasses com o PagBank. Checkout simples
   não equivale a marketplace com divisão automática.
4. Implementar tentativas financeiras idempotentes, com proteção contra
   concorrência e contra pagamento duplicado.
5. Configurar credencial de sandbox somente no servidor e implementar o
   adaptador PagBank, seus erros, expiração e respostas incertas.
6. Verificar notificações consultando o estado no provedor; o retorno do
   navegador não é prova de pagamento. Testar repetição, ordem dos eventos,
   estorno, cancelamento e conciliação, sem dinheiro real.

Referências:

- https://supabase.com/docs/guides/functions/connect-to-postgres
- https://supabase.com/docs/guides/functions/auth-legacy-jwt
- https://github.com/porsager/postgres
- https://developer.pagbank.com.br/docs/checkout
- https://developer.pagbank.com.br/reference/criar-checkout

O endpoint documentado de checkout sandbox é
`https://sandbox.api.pagseguro.com/checkouts`. Nenhuma chamada ao PagBank é
feita por este serviço.
