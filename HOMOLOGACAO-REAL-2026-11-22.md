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
