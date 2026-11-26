import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';

test('reclamações: recupera envios incertos, resposta profissional e fila privada sem movimentação financeira',async t=>{
 const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});t.after(()=>browser.close());
 const page=await browser.newPage();page.setDefaultTimeout(5000);page.on('dialog',d=>d.accept());
 const cliente='11111111-1111-4111-8111-111111111111',prof='22222222-2222-4222-8222-222222222222',id='33333333-3333-4333-8333-333333333333';
 let salvo,resposta,posts=0,divergente=false,negado=false;
 const descricao='<img src=x onerror=alert(1)> Serviço apresentou problema.';
 await page.route('https://teste.invalid/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;
  assert.match(path,/^\/rest\/v1\/(reclamacoes_servico|respostas_reclamacao|rpc\/listar_reclamacoes_administrativas)$/);
  if(path.includes('/rpc/'))return negado?route.fulfill({status:403,json:{}}):route.fulfill({json:[{...salvo,titulo:'Pedido fictício',resposta}]});
  if(req.method()==='POST'){
   posts++;const dados=req.postDataJSON();assert.equal(dados.solicitacao_id,id);assert.equal(Object.hasOwn(dados,'criado_em'),false);
   if(path.endsWith('/reclamacoes_servico'))salvo={...dados,cliente_usuario_id:cliente,criado_em:'2026-11-26T12:00:00Z'};
   else resposta={...dados,profissional_usuario_id:prof,criado_em:'2026-11-26T12:30:00Z'};
   return route.abort('failed');
  }
  return route.fulfill({json:path.endsWith('/respostas_reclamacao')?(resposta?[resposta]:[]):salvo?[{...salvo,cliente_usuario_id:divergente?prof:cliente}]:[]});
 });
 await page.setContent('<div id="solicitacoes"><div id="card"></div></div><button id="abrir-reclamacoes-admin"></button><section id="reclamacoes-admin"><button id="atualizar-reclamacoes-admin"></button><div id="lista-reclamacoes-admin"></div><p id="status-reclamacoes-admin"></p><button id="anterior-reclamacoes-admin"></button><button id="proxima-reclamacoes-admin"></button></section>');
 await page.addScriptTag({content:`let sessaoServicos={usuario:'${cliente}',token:'ficticio'},versaoPedidos=1,ocupado=false;
 const elemento=id=>document.getElementById(id);
 const texto=(tag,valor)=>{const n=document.createElement(tag);n.textContent=valor;return n;};
 const botaoAcao=(valor,fn)=>{const b=texto('button',valor);b.addEventListener('click',fn);return b;};
 const bloquear=(s,b)=>s.querySelectorAll('button,input,select,textarea').forEach(n=>n.disabled=b);
 const proteger=()=>{};
 const enviar=(path,body,token,prefer,method='POST')=>fetch('https://teste.invalid'+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const exigirNovoLogin=()=>{sessaoServicos=undefined;document.getElementById('card').replaceChildren();limparReclamacoesAdmin();};
 const pedido={id:'${id}',titulo:'Pedido fictício',cliente_usuario_id:'${cliente}',profissional_usuario_id:'${prof}'};`});
 await page.addScriptTag({content:await readFile(new URL('../sessao.js',import.meta.url),'utf8')});
 await page.addScriptTag({content:'controleSessao.alterar(sessaoServicos);'});
 await page.addScriptTag({content:await readFile(new URL('../reclamacoes.js',import.meta.url),'utf8')});
 await page.evaluate(()=>adicionarReclamacaoServico(elemento('card'),pedido,true));
 await page.getByText('Problemas e reclamações — Pedido fictício',{exact:true}).click();
 await page.getByRole('button',{name:'Consultar reclamação',exact:true}).click();
 await page.getByText('Nenhuma reclamação registrada neste pedido.',{exact:true}).waitFor();
 await page.getByLabel('Motivo da reclamação').selectOption('qualidade');await page.getByLabel('Descreva o problema').fill(descricao);
 await page.getByRole('button',{name:'Registrar reclamação',exact:true}).click();
 await page.getByText('Não foi possível confirmar o registro.',{exact:false}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Registrar reclamação',exact:true}).isVisible(),false);
 await page.getByRole('button',{name:'Consultar reclamação',exact:true}).click();
 await page.getByText('Registro recebido para análise.',{exact:false}).waitFor();assert.equal(posts,1);assert.equal(await page.locator('img').count(),0);
 await page.evaluate(prof=>{sessaoServicos={usuario:prof,token:'outro-ficticio'};controleSessao.alterar(sessaoServicos);versaoPedidos++;elemento('card').replaceChildren();adicionarReclamacaoServico(elemento('card'),pedido,false);},prof);
 await page.getByText('Problemas e reclamações — Pedido fictício',{exact:true}).click();await page.getByRole('button',{name:'Consultar reclamação',exact:true}).click();
 await page.getByLabel('Resposta do profissional').fill('Vou analisar o problema relatado pelo cliente.');
 await page.getByRole('button',{name:'Registrar resposta',exact:true}).click();await page.getByText('Não foi possível confirmar o registro.',{exact:false}).waitFor();
 await page.getByRole('button',{name:'Consultar reclamação',exact:true}).click();await page.getByRole('heading',{name:'Resposta do profissional',exact:true}).waitFor();assert.equal(posts,2);
 assert.equal(await page.getByRole('button',{name:'Registrar resposta',exact:true}).isVisible(),false);
 divergente=true;await page.getByRole('button',{name:'Consultar reclamação',exact:true}).click();await page.getByText('Não foi possível consultar a reclamação. Tente novamente.',{exact:true}).waitFor();assert.equal(await page.getByText(descricao,{exact:true}).count(),0);
 await page.evaluate(()=>carregarReclamacoesAdmin());assert.equal(await page.locator('#lista-reclamacoes-admin article').count(),1);assert.equal(await page.locator('img').count(),0);
 negado=true;await page.evaluate(()=>carregarReclamacoesAdmin());assert.equal(await page.locator('#lista-reclamacoes-admin article').count(),0);assert.match(await page.locator('#status-reclamacoes-admin').innerText(),/reservada/);
 await page.evaluate(()=>limparReclamacoesAdmin());assert.equal(await page.locator('#status-reclamacoes-admin').innerText(),'');assert.equal(posts,2);
});
