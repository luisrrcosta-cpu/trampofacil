# trampofacil
Plataforma 
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TrampoFácil</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:Arial,sans-serif;background:#f3f6fb;color:#17243b}
header{background:#123b76;color:white;padding:22px;text-align:center}
header h1{margin:0;font-size:30px}
header p{margin:8px 0 0;color:#dbeafe}
main{max-width:650px;margin:auto;padding:22px 16px}
.hero{text-align:center;padding:24px 8px}
.hero h2{font-size:27px;margin:0 0 12px}
.hero p{color:#64748b;line-height:1.6}
.search{width:100%;padding:16px;border:1px solid #cbd5e1;border-radius:12px;font-size:16px}
.btn{display:block;width:100%;border:0;border-radius:12px;padding:17px;margin-top:12px;font-size:16px;font-weight:bold;cursor:pointer}
.blue{background:#1769e0;color:white}
.green{background:#16a34a;color:white}
h3{margin-top:30px}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.card{background:white;border-radius:14px;padding:22px 10px;text-align:center;box-shadow:0 3px 12px #0000000a;cursor:pointer}
.card span{display:block;font-size:32px;margin-bottom:10px}
.card strong{font-size:14px}
#mensagem{text-align:center;color:#1769e0;font-weight:bold;margin-top:18px}
footer{text-align:center;padding:25px;color:#64748b;font-size:13px}
</style>
</head>
<body>
<header>
<h1>🔧 TrampoFácil</h1>
<p>Conectando quem precisa com quem faz!</p>
</header>
<main>
<section class="hero">
<h2>Encontre o profissional ideal</h2>
<p>Serviços de qualidade, perto de você. Simples, rápido e seguro.</p>
<input class="search" id="busca" placeholder="Qual serviço você precisa?">
<button class="btn blue" onclick="acao('Busca de profissionais')">🔎 Encontrar profissional</button>
<button class="btn green" onclick="acao('Cadastro profissional')">🧰 Sou profissional</button>
</section>
<h3>Explore os serviços</h3>
<div class="grid">
<div class="card" onclick="acao('Eletricista')"><span>⚡</span><strong>Eletricista</strong></div>
<div class="card" onclick="acao('Encanador')"><span>🔧</span><strong>Encanador</strong></div>
<div class="card" onclick="acao('Diarista')"><span>🧹</span><strong>Diarista</strong></div>
<div class="card" onclick="acao('Pintor')"><span>🎨</span><strong>Pintor</strong></div>
<div class="card" onclick="acao('Jardineiro')"><span>🌿</span><strong>Jardineiro</strong></div>
<div class="card" onclick="acao('Montador')"><span>🪛</span><strong>Montador</strong></div>
</div>
<p id="mensagem"></p>
</main>
<footer>© 2026 TrampoFácil — Todos os direitos reservados.</footer>
<script>
function acao(tipo){
document.getElementById('mensagem').textContent=tipo+' — em breve!';
}
</script>
</body>
</html>
 contratação de profissionais e serviços com pagamentos online.

## Cadastro de clientes e profissionais

A página funciona em modo de demonstração por padrão, com dados fictícios e
sem envio. Para testar a interface localmente, sirva a pasta do repositório
com `python3 -m http.server 8000 --bind 127.0.0.1` e abra
`http://127.0.0.1:8000`.

Para testar o fluxo conectado, use um projeto Supabase de homologação com a
estrutura já existente no TrampoFácil. Confirme as políticas de titularidade
de `clientes` e `profissionais` e aplique em homologação as migrações desta branch em ordem. Elas são
incrementais e dependem das tabelas, políticas e triggers já existentes.

No Supabase Auth de homologação, habilite o cadastro e a confirmação por
e-mail e configure o template **Magic Link** para incluir o código
`{{ .Token }}`. Configure o envio de e-mail para as contas de teste e valide
os limites de envio do Auth e a proteção contra abuso antes da abertura ao
público. Em `config.js`, preencha:

```js
window.TRAMPOFACIL_SUPABASE = {
  url: 'https://referencia-do-projeto.supabase.co',
  chavePublicavel: 'sb_publishable_...',
};
```

A gravação acontece após a confirmação por código. O cadastro repetido
atualiza o perfil do titular para o mesmo tipo de conta. O acesso usado na
gravação fica em memória até sair, recarregar a página ou a sessão expirar. A publicação de profissionais
depende do controle existente no backend.

## Busca e solicitações

Em modo conectado, a busca filtra os profissionais ativos por serviço e
cidade e retorna páginas de até 20 resultados. O catálogo é separado dos
perfis privados e não contém WhatsApp ou e-mail.

Um cliente autenticado com cadastro completo pode solicitar um serviço.
Cliente e profissional acompanham as solicitações em páginas de até 50,
começando pelas mais recentes. O profissional pode enviar um orçamento, iniciar o trabalho e marcar a entrega.
O cliente pode aceitar a proposta e concluir o serviço. A opção de
cancelamento segue as regras de cada status, verificadas pelo banco.
O valor da proposta é um orçamento em reais.

Em **Minhas solicitações**, use **Ver histórico e mensagens** para consultar
os eventos registrados pelo banco e conversar com a outra parte. Os itens
mais recentes aparecem primeiro, com opção de carregar os anteriores e de
atualizar a tela. O histórico mostra data, status e valor quando disponível.
As mensagens identificam os autores como **Você** ou **Outra parte**.

As políticas RLS existentes limitam a conversa aos participantes. O banco
atribui a autoria e impede novas mensagens após conclusão ou cancelamento.
O histórico e as mensagens anteriores continuam disponíveis aos
participantes. A tela não solicita e-mail, WhatsApp ou dados de perfil.

## Testes locais

Com Node.js 20+ e Chromium instalado, execute `npm ci` e `npm test`.
Use `TRAMPOFACIL_CHROMIUM` para indicar o executável do Chromium quando ele
estiver fora de `/usr/bin/chromium`. Os testes usam Chromium com a API
simulada e PostgreSQL local via PGlite com um esquema mínimo, dados
fictícios e uma cópia dos triggers de solicitação.

Para executar apenas os testes sem navegador, use `npm run test:local`.
`npm run test:browser` executa a suíte de interface; `npm test` mantém a suíte
completa, sem esconder falhas de navegador. A conversão de valores usa
`valores.js`, rejeita números ambíguos e não arredonda casas adicionais.

Verificação de 19/11/2026: os três testes sem navegador passaram, cobrindo
contratação até conclusão, isolamento de terceiros, autoria de mensagens,
bloqueio de mensagens após encerramento, integridade do histórico, proteção
do preço aceito e limites monetários. Tudo foi executado em PGlite em memória,
sem conexão com o Supabase de produção. O Chromium não iniciou neste ambiente
por bloqueio de socket (`Operation not permitted`); a suíte de interface
continua pendente de execução em um ambiente compatível.

## Limite dos testes de pagamentos

Ainda não existe checkout, tabela de pagamentos, webhook ou provedor integrado.
Aceitar proposta não cobra e concluir um serviço não comprova pagamento.
A tela de solicitações informa essa limitação. Os testes validam somente os
valores do orçamento e rejeitam tentativas de mudar a solicitação para um
estado financeiro inventado (`pago`). Eles não validam Pix, cartão, estorno,
repasse ou idempotência de webhook. Esses testes dependem da escolha do
provedor e de credenciais de sandbox; não usar credenciais de produção.

## Integrações pendentes

- Homologar o envio real de códigos e os fluxos de cadastro, busca e
  solicitações, histórico e mensagens pela Data API em homologação.
- Definir o provedor de pagamentos antes da implementação. A aplicação
  atual grava apenas o valor proposto.

