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

1. Validar os adaptadores reais de autenticação/consulta no projeto separado
   `TrampoFacil-Homologacao`. A estrutura e os testes transacionais estão
   documentados em `supabase/homologacao/README.md`. Não usar produção.
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

## Adaptador de consulta e handler de homologação

`supabase-homologacao.js` implementa os adaptadores via HTTPS: valida o token
em `/auth/v1/user` e consulta a solicitação pela Data API com o JWT do próprio
cliente. São apenas requisições GET, sem chave administrativa, preservando RLS.
O projeto de produção conhecido é explicitamente recusado, assim como URLs
externas, HTTP, caminhos/credenciais na URL e chaves secretas. A configuração
exige `ambiente: 'teste'` e `projetoHomologacaoConfirmado: true` no servidor.

`handler-preparacao.js` recebe objetos Web `Request` e devolve `Response` para
`POST /api/pagamentos/preparar`. Ele aceita apenas a origem HTTPS configurada
quando há Origin, exige JSON, limita o corpo a 4 KiB e sua leitura a 5 segundos,
e envia respostas com `Cache-Control: no-store`. CORS não substitui autenticação:
inclusive clientes sem Origin precisam fornecer um token válido. Não existe
rota para cobrar ou marcar pagamentos como pagos.

Composição para uma hospedagem de homologação futura:

```js
import {criarAdaptadoresHomologacao} from './supabase-homologacao.js';
import {criarPreparadorPagamento} from './preparar-pagamento.js';
import {criarHandlerPreparacao} from './handler-preparacao.js';

// Carregar estes valores das configurações do servidor, nunca do corpo HTTP.
export function montar(config) {
  const adaptadores = criarAdaptadoresHomologacao(config);
  const preparador = criarPreparadorPagamento({ambiente:'teste', ...adaptadores});
  return criarHandlerPreparacao({preparador, origemPermitida:config.origemPermitida});
}
```

Os arquivos não iniciam um servidor nem publicam uma função automaticamente.
O projeto de homologação e seu esquema já estão preparados. Ainda é necessário
configurar a origem e a chave publicável correspondentes e selecionar a
hospedagem. Não apontar `config.js` para produção para contornar essa etapa.
Não há chamadas ao PagBank, credenciais de sandbox ou cobrança nesta composição.

Nove testes novos exercitam o handler inteiro com `Request`/`Response` e
respostas simuladas do Auth/Data API. Eles incluem rejeição do projeto de
produção, anonimato, e-mail não confirmado, tentativa de alterar valores,
acesso a orçamento de outra pessoa e corpos excessivos/interrompidos. A suíte
local soma 31 testes aprovados. O banco real de homologação passou no teste
transacional de contratação e mensagens; estes adaptadores HTTP ainda não
foram exercitados com sessões reais do Auth.
