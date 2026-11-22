# Homologação real — 22/11/2026

Ambiente exclusivo: TrampoFacil-Homologacao (asdszqtpydiowgerxwee).
Prévia privada: https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site
Produção e main não foram alterados. Nenhuma cobrança ou transferência foi realizada.

## Evidências verificadas

| Etapa | Resultado |
| --- | --- |
| SMTP e convite | Usuário confirmou recebimento após usar senha de app |
| OTP | Validação real confirmada; interface aceita seis ou oito dígitos |
| Perfis | Cliente e profissional salvos; catálogo do único profissional fictício aprovado na homologação |
| Solicitação | Criada às 14:22 |
| Mensagem | Enviada às 14:26, preservada após encerramento |
| Proposta | R$ 100,00 às 14:30 |
| Aceite | Cliente aceitou às 14:34 |
| Preparação financeira | Registro real confirmado no banco às 14:52: crédito à vista, uma parcela, serviço 10000, profissional 9000, plataforma 1000 centavos |
| Execução | Em andamento 14:57; entregue 14:58; concluída pelo cliente 14:59 |
| Histórico | Seis eventos confirmados por consulta; imagem 15:02 mostra todas as etapas |
| Conversa encerrada | Imagem 15:02 mostra mensagem preservada, aviso de somente leitura e ausência de formulário |

Os horários são de São Paulo. A sequência foi exercitada pelo usuário com duas contas; não constitui teste de acesso indevido por terceiros.

## Falha corrigida no serviço

A URL de banco fornecida pelo ambiente continha sslmode=prefer. A validação anterior recusava parâmetros. O código passa a aceitar somente sslmode prefer/require/verify-full, descartando esse parâmetro e construindo opções explícitas com ssl.rejectUnauthorized=true. disable, allow, parâmetros desconhecidos, duplicados, hosts externos e projeto de produção continuam bloqueados. A função remota versão 7 preserva autenticação no corpo, CORS restrito, consulta com JWT do cliente e transação idempotente privada.

O diagnóstico registra apenas categorias fixas; sondagens temporárias de configuração foram removidas. Não foram lidos ou registrados valores de senha ou URL de conexão.

## Ajuste decorrente do teste

A descrição da solicitação de teste ainda continha [informe]. A expressão regular estava escapada duas vezes. Corrigida para impedir novas solicitações com [informe] ou [descreva], inclusive com espaços e maiúsculas. Dados existentes não foram alterados. O teste de navegador verifica que essas entradas não geram POST e que uma descrição preenchida continua funcionando.

## Pendências

- Testes HTTP de isolamento entre contas, além dos testes automatizados em banco isolado.
- Integração PagBank sandbox autenticada, ainda sem credencial fornecida.
- Definição de taxas online, impostos, elegibilidade de split e destinatários.
- Checkout, validação de webhook, conciliação, estornos e repasses.
- Aprovação separada antes de publicação em produção ou ativação financeira real.

A preparação não equivale a pagamento, reserva, autorização de cartão ou repasse. A divisão 90/10 considera apenas o valor do serviço, antes de impostos e taxas.

## Próxima integração financeira

Documentação oficial consultada em 22/11/2026:
- https://developer.pagbank.com.br/docs/token-de-autenticacao — token sandbox obtido no Portal do Desenvolvedor, aba Tokens. Não enviar esse token em mensagens nem incluir no frontend/Git.
- https://developer.pagbank.com.br/docs/servicos-de-pedidos-e-pagamentos — separar pedido e pagamento, considerar taxas do recebedor primário e validar cancelamentos/chargebacks. O token, sozinho, não habilita todas as funcionalidades.

Usar somente ambiente sandbox e dados fictícios. O próximo bloqueio externo é a autenticação da conta do desenvolvedor e o provisionamento seguro da credencial no servidor. Nenhuma credencial foi solicitada por chat ou presumida disponível.

A prévia privada versão 6 publicou a validação dos modelos. O CI de preparação antigo ainda exigia autenticacaoPronta=false, apesar de OTP já validado; atualizado para exigir a configuração atual de homologação e usar o empacotamento por lista permitida.

## Conexão PagBank sandbox validada

Em 22/11/2026, após o usuário salvar PAGBANK_SANDBOX_TOKEN nos Secrets da homologação, a função confirmou somente a presença da variável, sem retornar seu valor. Uma consulta autenticada GET https://sandbox.api.pagseguro.com/public-keys/card retornou HTTP 200 e chave pública disponível.

A sondagem foi temporária e removida. A função preparar-pagamento-teste voltou à composição anterior (versão remota 12). Não foram criados nem alterados chaves públicas, pedidos, cobranças, cartões ou repasses. A resposta do provedor não foi persistida; os logs contêm somente status e booleano.

O módulo server/chave-pagbank-sandbox.js prepara a mesma consulta somente de leitura para futura composição interna. Os três testes cobrem destino fixo, GET, recusa de produção, token malformado, respostas 401/403/404/500, transporte e respostas inválidas, sem propagação de token ou resposta bruta. Ainda não há nova rota HTTP pública.

Documentação: https://developer.pagbank.com.br/reference/consultar-chave-publica
A autenticação aprovada neste endpoint não comprova habilitação para split, cobrança, captura ou repasse. Checkout, persistência de tentativa, assinatura de notificações, conciliação e políticas comerciais continuam pendentes.

## Verificação criptográfica de notificações preparada

Implementados módulos internos (sem rota pública e sem atualização financeira):
- server/webhook-assinatura-sandbox.js valida SHA-256/ECDSA sobre Uint8Array com bytes originais e chave SPKI EC confiável, separada do corpo recebido.
- server/webhook-chave-sandbox.js consulta somente GET sandbox /public-keys?type=webhook, mantém cache por dez minutos, compartilha consultas simultâneas e falha sem reutilizar chave expirada.

Seis testes passaram com pares de chaves e assinaturas criptográficas reais geradas isoladamente. Cobrem alteração de status e reserialização do corpo, outra chave, ausência e má formação da assinatura, rotação com uma assinatura válida, limites de tamanho e quantidade, recusa de produção e chave de cartão RSA, cache e indisponibilidade do provedor. Não são notificações reais recebidas do PagBank.

Documentação consultada: https://developer.pagbank.com.br/reference/validacao-de-autenticidade
O novo modelo usa x-payload-signature e chave type=webhook; a chave card e o modelo anterior de hash com token não são intercambiáveis. Antes de produção, confirmar disponibilidade do novo serviço e a URL de produção, conforme ressalva do provedor.

Faltam compor leitura limitada do corpo HTTP, persistência idempotente/rejeição de replays e associação do evento à tentativa e valor esperados, seguida de conferência no provedor. Assinatura válida sozinha não registra pagamento nem libera repasse. Nenhum endpoint de webhook foi ativado.
