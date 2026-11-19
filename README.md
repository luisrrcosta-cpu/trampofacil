# TrampoFácil

Plataforma de contratação de profissionais em desenvolvimento.

O trabalho atual está na ramificação `codex/v16-seguranca-integracoes`.
A versão publicada, a main e o banco de produção não são alterados por estes testes.

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

## Verificação

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
