import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {chromium} from 'playwright-core';

test('avaliação na aplicação mostra data, restaura consulta e isola sessão expirada ou substituída',async t=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const arquivos=new Set(['index.html',...[...html.matchAll(/<script\s+src="([^"]+)"\s+defer>/g)].map(m=>m[1])]);
 const server=createServer(async(req,res)=>{
  const arquivo=req.url==='/'?'index.html':req.url.slice(1);
  if(!arquivos.has(arquivo)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
  res.end(await readFile(new URL('../'+arquivo,import.meta.url)));
 }).listen(0,'127.0.0.1');
 await once(server,'listening');t.after(()=>server.close());
 const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});t.after(()=>browser.close());
 const page=await browser.newPage();page.setDefaultTimeout(5000);
 const cliente='11111111-1111-4111-8111-111111111111',profissional='22222222-2222-4222-8222-222222222222';
 const pedido={id:'77777777-7777-4777-8777-777777777777',cliente_usuario_id:cliente,profissional_usuario_id:profissional,titulo:'Serviço de teste',descricao:'Descrição fictícia',status:'concluida',valor_centavos:10000,atualizado_em:'2026-11-25T12:00:00Z'};
 let expirada=false,adiar=false,liberar,avisar;
 let consultas=0,escritas=0;
 const emEspera=new Promise(resolve=>{avisar=resolve;});
 await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
  const req=route.request(),url=new URL(req.url());
  assert.equal(url.pathname,'/rest/v1/avaliacoes_servico');
  if(req.method()!=='GET'){escritas++;return route.fulfill({status:405,json:{}});}
  consultas++;
  assert.equal(req.headers().authorization,'Bearer cliente-ficticio');
  assert.equal(url.searchParams.get('solicitacao_id'),'eq.'+pedido.id);
  if(adiar)await new Promise(resolve=>{liberar=resolve;avisar();});
  if(expirada)return route.fulfill({status:401,json:{}});
  return route.fulfill({json:[{solicitacao_id:pedido.id,cliente_usuario_id:cliente,nota:5,criado_em:'2026-11-25T12:00:00Z'}]});
 });
 const url=`http://127.0.0.1:${server.address().port}/`;
 async function abrir(){
  await page.goto(url);
  await page.evaluate(({cliente,pedido})=>{
   iniciarSessao({token:'cliente-ficticio',usuario:cliente});
   mostrar('solicitacoes');listaPedidos.append(mostrarPedido(pedido));
  },{cliente,pedido});
 }
 await abrir();
 await page.getByRole('button',{name:'Consultar avaliação do serviço',exact:true}).click();
 await page.getByText('Registrada em 25/11/2026, 09:00 (horário de Brasília).',{exact:true}).waitFor();
 const data=page.locator('#lista-solicitacoes time').filter({hasText:'Registrada em'});
 assert.equal(await data.getAttribute('datetime'),'2026-11-25T12:00:00.000Z');
 assert.equal(await page.getByRole('button',{name:'Registrar avaliação',exact:true}).isVisible(),false);
 assert.equal(escritas,0);
 // Reabrir a aplicação não deve gravar uma nova avaliação.
 await abrir();
 await page.getByRole('button',{name:'Consultar avaliação do serviço',exact:true}).click();
 await page.getByText('Avaliação registrada: 5 de 5.',{exact:false}).waitFor();
 assert.equal(consultas,2);assert.equal(escritas,0);
 // Resposta tardia após sair não pode repor nota ou data na tela.
 adiar=true;
 await page.getByRole('button',{name:'Consultar avaliação do serviço',exact:true}).click();
 await emEspera;
 await page.evaluate(()=>{iniciarSessao(undefined);mostrar('inicio');});
 const concluida=page.waitForResponse(r=>r.url().includes('/rest/v1/avaliacoes_servico'));
 liberar();await concluida;
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 assert.equal(await page.locator('#lista-solicitacoes').textContent(),'');
 assert.equal(await page.getByText('Registrada em',{exact:false}).count(),0);
 // Expiração retorna ao login normal, sem expor a avaliação antiga.
 adiar=false;expirada=true;
 await abrir();
 await page.getByRole('button',{name:'Consultar avaliação do serviço',exact:true}).click();
 await page.locator('#entrar').waitFor({state:'visible'});
 assert.equal(await page.locator('#lista-solicitacoes').textContent(),'');
 assert.equal(escritas,0);
});
