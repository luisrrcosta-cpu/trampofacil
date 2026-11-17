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
