import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {chromium} from 'playwright-core';

async function preparar(t){
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const arquivos=new Set(['index.html',...[...html.matchAll(/<script\s+src="([^"]+)"\s+defer>/g)].map(x=>x[1])]);
 const server=createServer(async(req,res)=>{const f=req.url==='/'?'index.html':req.url.slice(1);if(!arquivos.has(f)){res.writeHead(404).end();return;}res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');res.end(await readFile(new URL('../'+f,import.meta.url)));}).listen(0,'127.0.0.1');
 await once(server,'listening');t.after(()=>server.close());
 const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:360,height:740},isMobile:true,hasTouch:true});page.setDefaultTimeout(5000);
 const erros=[];page.on('pageerror',e=>erros.push(e.message));
 const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
 const cliente=uuid(8000),prof=uuid(8001),outro=uuid(8002);
 const pedido=n=>({id:uuid(n),cliente_usuario_id:cliente,profissional_usuario_id:prof,titulo:'Pedido fictício '+n,descricao:'Descrição fictícia do serviço.',status:'aceita',valor_centavos:10000,atualizado_em:'2026-11-26T12:00:00.123456+00:00'});
 const recentes=Array.from({length:51},(_,i)=>pedido(1000-i));
 const alvo={...pedido(99),titulo:'Serviço antigo '+ 'X'.repeat(90),descricao:'Detalhes fictícios '+ 'D'.repeat(2600),status:'concluida',atualizado_em:'2026-11-25T12:00:00.123456+00:00'};
 let modo='normal',pontuais=0,paginacoes=0,escritas=0,segurar=false,avisar,liberar;
 await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname==='/rest/v1/rpc/listar_avisos_atendimento')return route.fulfill({json:[{evento_id:uuid(9000),tipo:'contratacao',solicitacao_id:alvo.id,titulo:alvo.titulo,mensagem:'O cliente confirmou a conclusão do serviço.',status:'concluida',criado_em:alvo.atualizado_em,lido_em:null}]});
  assert.equal(url.pathname,'/rest/v1/solicitacoes');if(req.method()!=='GET'){escritas++;return route.fulfill({status:405,json:{}});}
  assert.equal(req.headers().authorization,'Bearer cliente-ficticio');
  if(url.searchParams.has('id')){
   pontuais++;assert.equal(url.searchParams.get('id'),'eq.'+alvo.id);assert.equal(url.searchParams.get('limit'),'1');
   if(segurar){avisar();await new Promise(resolve=>liberar=resolve);}
   if(modo==='401')return route.fulfill({status:401,json:{}});
   if(modo==='ausente')return route.fulfill({json:[]});
   if(modo==='alheio')return route.fulfill({json:[{...alvo,cliente_usuario_id:outro,titulo:'SEGREDO DE OUTRA CONTA'}]});
   if(modo==='divergente')return route.fulfill({json:[{...alvo,id:uuid(98),titulo:'PEDIDO DIVERGENTE'}]});
   return route.fulfill({json:[alvo]});
  }
  if(url.searchParams.has('or')){
   paginacoes++;assert.ok(url.searchParams.get('or').includes(recentes[49].id));assert.ok(!url.searchParams.get('or').includes(alvo.id));
   return route.fulfill({json:[recentes[50],alvo]});
  }
  return route.fulfill({json:modo==='primeira_pagina'?[alvo]:recentes});
 });
 const abrir=async()=>{await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.evaluate(cliente=>{iniciarSessao({token:'cliente-ficticio',usuario:cliente});mostrar('inicio');},cliente);await page.getByRole('button',{name:'Meus avisos',exact:true}).click();await page.getByRole('button',{name:'Ver solicitação',exact:true}).waitFor();};
 return{page,abrir,alvo,recentes,cliente,outro,erros,modo:v=>modo=v,segurar:()=>{segurar=true;return new Promise(resolve=>avisar=resolve);},liberar:()=>liberar(),contagens:()=>({pontuais,paginacoes,escritas})};
}

test('atalho de aviso encontra pedido antigo no celular, limpa filtros e preserva paginação',async t=>{
 const c=await preparar(t),{page}=c;
 for(const width of [320,360,390,768]){
  await page.setViewportSize({width,height:740});await c.abrir();
  await page.evaluate(()=>{filtroPedidos.value='cancelada';direcaoPedidos.value='recebida';buscaPedidos.value='não corresponde';});
  await page.getByRole('button',{name:'Ver solicitação',exact:true}).click();
  const card=page.locator('[data-solicitacao-id="'+c.alvo.id+'"]');await card.waitFor();
  await page.getByText('Solicitação localizada. Os filtros foram limpos para exibir este pedido.',{exact:true}).waitFor();
  assert.equal(await page.locator('#lista-solicitacoes > article').count(),51);
  assert.equal(await card.locator('h3').evaluate(n=>document.activeElement===n),true);
  assert.equal(await card.evaluate(n=>n.classList.contains('solicitacao-destacada')),true);
  assert.equal(await page.locator('#filtro-solicitacoes').inputValue(),'todas');assert.equal(await page.locator('#direcao-solicitacoes').inputValue(),'todas');assert.equal(await page.locator('#busca-solicitacoes').inputValue(),'');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  assert.ok(await card.evaluate(n=>n.scrollWidth<=n.clientWidth+1));
  await page.getByRole('button',{name:'Ver solicitações anteriores',exact:true}).click();
  await page.getByText('52 solicitação(ões) exibida(s) neste filtro.',{exact:true}).waitFor();
  assert.equal(await page.locator('[data-solicitacao-id="'+c.alvo.id+'"]').count(),1);
 }
 assert.deepEqual(c.contagens(),{pontuais:4,paginacoes:4,escritas:0});assert.deepEqual(c.erros,[]);
});

test('atalho recusa dados alheios, ID divergente e sessão antiga sem roubar foco',async t=>{
 const c=await preparar(t),{page}=c;
 for(const modo of ['ausente','alheio','divergente']){
  c.modo(modo);await c.abrir();await page.getByRole('button',{name:'Ver solicitação',exact:true}).click();
  await page.getByText(modo==='ausente'?'Esta solicitação não está disponível para sua conta. Atualize os avisos para continuar.':'Não foi possível abrir a solicitação indicada. Atualize os avisos e tente novamente.',{exact:true}).waitFor();
  assert.equal(await page.locator('[data-solicitacao-id="'+c.alvo.id+'"]').count(),0);assert.equal(await page.getByText(/SEGREDO DE OUTRA CONTA|PEDIDO DIVERGENTE/).count(),0);
 }
 c.modo('primeira_pagina');await c.abrir();const antes=c.contagens().pontuais;await page.getByRole('button',{name:'Ver solicitação',exact:true}).click();await page.locator('.solicitacao-destacada h3').waitFor();assert.equal(c.contagens().pontuais,antes,'não faz consulta extra quando o pedido já está carregado');
 c.modo('401');await c.abrir();await page.getByRole('button',{name:'Ver solicitação',exact:true}).click();await page.getByText('Sua sessão expirou. Entre novamente para continuar.',{exact:true}).waitFor();assert.equal(await page.locator('#lista-solicitacoes > article').count(),0);
 c.modo('normal');await c.abrir();const chegou=c.segurar();await page.getByRole('button',{name:'Ver solicitação',exact:true}).click();await chegou;
 await page.evaluate(outro=>{iniciarSessao({token:'outra-conta-ficticia',usuario:outro});mostrar('inicio');},c.outro);c.liberar();await page.waitForLoadState('networkidle');assert.equal(await page.locator('#lista-solicitacoes > article').count(),0);assert.equal(await page.locator('.solicitacao-destacada').count(),0);
 // Uma solicitação inválida é recusada antes de consultar a API.
 const antesInvalido=c.contagens().pontuais;await page.evaluate(()=>retornarParaSolicitacoes('inválido'));assert.equal(c.contagens().pontuais,antesInvalido);
 assert.equal(c.contagens().escritas,0);assert.deepEqual(c.erros,[]);
});
