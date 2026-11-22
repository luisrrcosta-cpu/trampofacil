# TrampoFácil

Plataforma de contratação de profissionais em desenvolvimento.

O trabalho atual está na ramificação `codex/v16-seguranca-integracoes`.
A versão publicada, a main e o banco de produção não são alterados por estes testes.

## Acesso integrado na prévia privada — 22/11/2026

O proprietário concluiu o diagnóstico real: OTP de oito dígitos aceito,
identidade confirmada pelo Auth e sessão de teste encerrada. Após essa evidência,
`autenticacaoPronta` passou a true exclusivamente na homologação privada.
O aplicativo aceita códigos completos de seis ou oito dígitos no cadastro e login.
Nenhum modelo, credencial, política RLS, banco de produção ou pagamento real
foi alterado neste lote.

Código: `859c055d634ba7cdef58ddc8685edb2ecb19b0d8`. Suíte completa: 112 testes,
zero falhas/ignorados; regressões aprovadas. O teste adicional de cadastro com
API simulada comprova que falha de gravação reutiliza a sessão sem consumir
outro OTP. Entrada por código, contratação e mensagens continuam protegidas.
Execução: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45047282635

A prévia privada foi atualizada para versão 5. O próximo passo manual é entrar
no aplicativo e salvar o próprio perfil de teste. Cadastro real, fluxo entre duas
contas, isolamento HTTP e preparação autenticada remota ainda exigem validação;
os testes simulados não equivalem a essa validação ponta a ponta.

Os registros abaixo sobre login bloqueado descrevem etapas históricas anteriores.

## Revisão e diagnóstico de login — 22/11/2026

A [revisão estruturada](REVISAO-2026-11-22.md) registra evidências, limites,
avisos de segurança e ordem dos próximos testes. SMTP entregou convite conforme
confirmado pelo proprietário; ainda falta validar OTP e sessão reais.

A página [login-teste.html](login-teste.html) foi adicionada à versão 3 da
mesma prévia privada. Ela pede código somente por ação explícita, para conta já
existente, valida a identidade no Auth e encerra apenas a sessão de teste.
Não cria usuários, não guarda tokens e não libera o aplicativo principal.
`autenticacaoPronta` continua false. Produção e pagamentos reais preservados.

O commit de código `40aa45e67081ca75cb58c89ee50269b01799f765` passou em 110 testes,
zero falhas/ignorados, além das regressões e concorrência PostgreSQL isolada:
https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45043737925

## Lote validado em 21/11/2026

Código: `611bf2189cd858c65d4a54a7ec51318468d5fda1`. A suíte completa passou
em 104 testes, zero falhas/ignorados, e nas regressões adicionais:
https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/44956310228
A concorrência com duas conexões PostgreSQL reais também passou, em banco
isolado e descartável, sem acessar o Supabase:
https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/44956310312

A prévia privada foi atualizada para a versão 2, mantendo acesso só ao dono:
https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site
A interface publicada corresponde aos arquivos públicos desse commit.
A versão 1 e seus checkpoints abaixo são registros históricos, não o snapshot
atual. A publicação não inclui módulos do servidor, SQL ou credenciais.

O empacotamento Edge agora confere as sete dependências. Nenhuma implantação
no Supabase foi feita neste lote: a função remota continua na versão 2 anterior.
`autenticacaoPronta: false` e pagamentos/repasses reais continuam bloqueados.
Faltam SMTP/login real, chamada autenticada remota, credenciais PagBank sandbox
e integração financeira completa. A main e o banco de produção não foram alterados.

## Ambiente conectado de testes

`config.js` usa exclusivamente o projeto Supabase `TrampoFacil-Homologacao`,
com chave publicável. A aplicação mostra um aviso de testes e permite consultar
seu catálogo público. Use somente dados fictícios. O catálogo começa vazio.
`ambiente.js` recusa qualquer projeto diferente do projeto de homologação permitido.
Para executar sem conexão, defina `window.TRAMPOFACIL_SUPABASE = null`.

Cadastro e login permanecem bloqueados por `autenticacaoPronta: false` até
verificar os modelos e a entrega dos códigos de e-mail. Essa restrição também
existe no transporte HTTP. Não desabilitar a confirmação de e-mail para contornar
problemas de envio. O modelo em português e o procedimento estão em
[supabase/homologacao/README.md](supabase/homologacao/README.md).

Para abrir localmente, sirva a pasta com
`python3 -m http.server 8000 --bind 127.0.0.1` e acesse `http://127.0.0.1:8000`.
Nenhum token de usuário é persistido em localStorage ou sessionStorage.

## Fluxos preparados

A busca filtra serviço e cidade, com até 20 profissionais por página. O catálogo
não contém telefone ou e-mail dos perfis privados.

Com autenticação validada, o cliente com perfil completo pode criar solicitações.
O profissional propõe o orçamento; o cliente aceita. O profissional registra
início e entrega, e o cliente conclui. As regras de transição, identidade e preço
aceito são verificadas no banco. O histórico registra os eventos. Solicitações
usam UUID para reconhecer repetição após uma resposta incerta.

Histórico e mensagens ficam restritos aos participantes por RLS. A autoria vem
da sessão no banco. Solicitações encerradas não recebem novas mensagens.
Mensagens com resposta de envio incerta exigem atualização antes de reenviar.
Respostas privadas antigas são descartadas após troca de sessão ou conta.

## Simulador e pagamentos

O simulador local não envia dados e não cria cobranças. Usa as referências
informadas para a maquininha: crédito à vista 4%; parcelado 12% no total em
2 a 10 vezes. Essas taxas ainda não são condições confirmadas do checkout online.

O profissional recebe 90% do orçamento, e a comissão da plataforma é 10%, antes
de impostos. O total simulado usa `teto(orcamento / (1 - taxa))` em centavos;
a eventual sobra de arredondamento é separada da comissão.

Para R$ 100: à vista R$ 104,17; parcelado R$ 113,64. Em 10 vezes, as parcelas
são 4 de R$ 11,37 e 6 de R$ 11,36. Nos dois cenários, a divisão-base é
R$ 90 para o profissional e R$ 10 para a plataforma, antes de impostos.
Pix, débito, tarifas fixas e impostos continuam sem taxas presumidas.

A preparação interna de pagamento usa identidade validada e orçamento salvo,
recusa valores injetados pelo navegador e sempre retorna pagamentos desativados.
O serviço Edge `preparar-pagamento-teste` está publicado somente na homologação,
com Auth/Data API e transação SQL privada. Falta validar uma chamada autenticada
real e configurar a integração da interface com a origem permitida.
Não há checkout PagBank, cobrança, webhook, repasse ou conciliação integrados.
Consulte [server/README.md](server/README.md) para as próximas etapas.

Na homologação existe agora um registro privado da preparação, com unicidade
por solicitação/versão e conferência atômica do orçamento. O servidor tem um
ponto de integração opcional, ligado à transação SQL na composição Edge.
Isso não implementa tentativas financeiras nem habilita cobrança. Os testes
reais dessa estrutura estão em `supabase/homologacao/validar-preparacao.sql`.

## Interface integrada de homologação

`Meu cadastro` permite consultar e editar o próprio perfil de cliente ou
profissional, usando o JWT da sessão e as políticas RLS existentes. E-mail de
acesso e publicação do profissional não podem ser alterados pela tela.
Campos privados e resultados pendentes são limpos quando a conta muda.

Em uma solicitação aceita, somente o cliente vê `Preparar pagamento de teste`.
A tela envia apenas solicitação, forma e parcelas ao serviço de homologação;
confere o resultado e mostra a divisão 90/10, antes de impostos. Ela não cria
checkout ou cobrança. Uma resposta incerta mantém as condições originais para
conferência; respostas de uma sessão anterior não voltam à tela.

A cópia privada está identificada em `supabase/homologacao/site.json`.
Acesse: https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site/
O acesso está restrito ao proprietário e pode pedir entrada com ChatGPT.
O catálogo de homologação e o simulador podem ser usados sem liberar o login
Supabase. Cadastros privados e preparação autenticada aguardam essa liberação.
`node scripts/preparar-interface.mjs <pasta>` copia somente HTML e os scripts
públicos declarados na página, sem código de servidor ou credenciais privadas.

Em 20/11/2026, a conexão correta foi restabelecida para a organização
Trampo fácil. A conexão da barbearia é separada; não removê-la para resolver
acesso deste projeto. Usar o projeto `asdszqtpydiowgerxwee` e verificar o nome
`TrampoFacil-Homologacao` antes de qualquer operação remota.

A função `preparar-pagamento-teste` foi atualizada para a versão 2 com a origem
CORS exata da interface privada. `npm run test:servico` passou nas seis
verificações remotas: sem sessão (401), token inválido (401), origem externa
(403), GET (405), corpo excessivo (413) e preflight da interface (204).
Nenhuma conta, preparação ou cobrança foi criada nesses testes.
A autenticação no corpo da função continua obrigatória em cada POST.

A auditoria automática de segurança não retornou alertas. As permissões
privadas continuam recusando leitura por anon, inserção por authenticated e
exclusão pelo papel de serviço. Não liberar `autenticacaoPronta` antes de
validar envio de e-mail, sessão real e chamada autenticada ao serviço.
O login do painel no navegador é separado do conector e continua pendente;
não repetir a conexão OAuth nem enfraquecer proteções para resolver isso.
Nenhuma alteração na produção foi realizada.

O commit `ebc5342866cf2153ff692a61a8c1eabf236fdd15` passou em 54 testes no
GitHub Actions, sem falhas ou testes ignorados, incluindo navegador, edição
de perfil, preparação incerta/repetida e troca de conta. As sete verificações
adicionais de regressão também passaram. A expiração de sessão na conversa
agora retorna à lista autorizada antes de reabrir o pedido e seu rascunho.
Execução: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/44790604347

A publicação privada usa o snapshot de interface desse commit, preservando
as funcionalidades existentes de filtros, paginação e confirmação de ações.
Ela é separada da versão publicada originalmente. A main do GitHub permaneceu
em `962d999b32d99bbab9e280bfa8144e798b558c6f`.

## Estado verificado em 21/11/2026

A execução isolada [44916672967](https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/44916672967), no commit `6860ea9ff653bb2fad9fdd5a6a3a232b3ca04b69`, terminou com **68 testes aprovados, zero falhas e zero testes ignorados**. As regressões adicionais de contratação, finanças e privacidade também passaram. As últimas correções alinharam os dados fictícios de mensagens, perfis e solicitações paginadas aos UUIDs exigidos pelas validações de segurança.

Esse resultado verifica o código com API simulada, **não** valida o login real, a entrega de e-mail, as políticas RLS em uma sessão autenticada real nem um pagamento online. `autenticacaoPronta` permanece `false`. A homologação real e a eventual publicação dependem de autorização e verificações próprias; nenhum pagamento real está habilitado.

## Comandos de verificação

Instale as dependências fixadas com `npm ci --ignore-scripts`.

- `npm run test:local`: testes isolados de banco, sessão, valores, simulador,
  preparação de pagamento, handler e seleção segura de ambiente.
- `npm run test:browser`: Chromium com API simulada, incluindo o bloqueio do
  envio de códigos enquanto a autenticação está pendente.
- `npm test`: suíte completa. Use `TRAMPOFACIL_CHROMIUM` para indicar outro
  executável. No GitHub Actions, o workflow instala seu próprio Chromium.
- `npm run test:homologacao`: verificação externa explícita e somente leitura
  do catálogo, bloqueios das tabelas privadas e exigência de sessão no Auth.
  Não envia e-mails, não cadastra contas e não altera o banco.
- `npm run test:servico`: verifica os bloqueios do endpoint publicado sem
  sessão válida; não cadastra contas ou preparações e não cria cobranças.

O teste transacional no PostgreSQL real de homologação também passou, com
três identidades fictícias e rollback integral. RLS está habilitada nas seis
tabelas; o verificador de segurança retornou zero alertas. Os testes SQL e
a verificação pública não substituem validar login real e as operações
privadas pela Data API com sessões do Auth.

O workflow de testes não publica o aplicativo, não recebe segredos e não
executa migrações ou chamadas ao Supabase. Produção permanece fora do escopo.
