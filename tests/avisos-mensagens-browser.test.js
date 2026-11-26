import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';

test('avisos de mensagens: abrir conversa sem envio, leitura privada, paginação e sessão',async t=>{
 const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});t.after(()=>browser.close());
 const page=await browser.newPage();page.setDefaultTimeout(5000);
 const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
 let avisos=Array.from({length:60},(_,i)=>({evento_id:uuid(60-i),tipo:'mensagem',solicitacao_id:uuid(99),titulo:'Pedido fictício',mensagem:'Mensagem de atendimento '+(60-i)+'\n<img src=x onerror=alert(1)>',status:null,criado_em:'2026-11-26T12:00:00.123456+00:00',lido_em:null}));
 const lidos=new Set();let posts=0,perder=true,segurar=false,liberar,iniciou;
 await page.route('https://teste.invalid/**',async route=>{
  const req=route.request();if(req.method()==='GET')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'});
  const path=new URL(req.url()).pathname,dados=req.postDataJSON();
  if(path.endsWith('/marcar_aviso_atendimento_lido')){
   posts++;assert.equal(dados.tipo,'mensagem');assert.deepEqual(Object.keys(dados).sort(),['evento_id','tipo']);lidos.add(dados.evento_id);
   if(perder)return route.abort('failed');return route.fulfill({json:'2026-11-26T13:00:00Z'});
  }
  assert.equal(path,'/rest/v1/rpc/listar_avisos_atendimento');
  const indice=dados.antes_id?avisos.findIndex(x=>x.evento_id===dados.antes_id)+1:0;
  if(dados.antes_id){assert.equal(dados.antes_id,uuid(11));assert.equal(dados.antes_em,'2026-11-26T12:00:00.123456+00:00');}
  const resposta=avisos.slice(indice,indice+51).map(x=>({...x,lido_em:lidos.has(x.evento_id)?'2026-11-26T13:00:00Z':null}));
  if(segurar){iniciou();await new Promise(resolve=>liberar=resolve);}
  return route.fulfill({json:resposta});
 });
 await page.goto('https://teste.invalid/fixture');
 await page.setContent('<button id="abrir-avisos-atendimento">Meus avisos</button><section id="avisos-atendimento"><button id="atualizar-avisos-atendimento">Atualizar avisos</button><p id="status-avisos-atendimento"></p><p id="resumo-avisos-atendimento"></p><div id="lista-avisos-atendimento"></div><button id="mais-avisos-atendimento" hidden>Ver avisos anteriores</button></section>');
 await page.addScriptTag({content:`let sessaoServicos={usuario:'ficticio',token:'token-ficticio'},ocupado=false,aberto;
 const elemento=id=>document.getElementById(id);const texto=(tag,valor)=>{const n=document.createElement(tag);n.textContent=valor;return n;};
 const botaoAcao=(valor,fn)=>{const b=texto('button',valor);b.addEventListener('click',fn);return b;};
 const bloquear=(s,b)=>s.querySelectorAll('button,input,select,textarea').forEach(n=>n.disabled=b);
 const proteger=destino=>{if(destino==='avisos-atendimento')carregarAvisosAtendimento();};const retornarParaSolicitacoes=id=>{throw Error('Aviso de mensagem deve abrir a conversa');};const abrirConversa=(...args)=>{aberto=args;};
 const enviar=(path,body)=>fetch('https://teste.invalid'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const exigirNovoLogin=()=>{sessaoServicos=undefined;controleSessao.alterar(sessaoServicos);limparAvisosAtendimento();};`});
 await page.addScriptTag({content:await readFile(new URL('../sessao.js',import.meta.url),'utf8')});await page.addScriptTag({content:'controleSessao.alterar(sessaoServicos);'});
 await page.addScriptTag({content:await readFile(new URL('../avisos.js',import.meta.url),'utf8')});
 await page.getByRole('button',{name:'Meus avisos',exact:true}).click();await page.getByText('50 não lido(s) entre os 50 avisos exibidos.',{exact:true}).waitFor();assert.equal(await page.locator('img').count(),0);
 assert.ok(await page.getByRole('heading',{name:'Nova mensagem — Pedido fictício',exact:true}).count());
 await page.locator('#lista-avisos-atendimento > article').first().getByRole('button',{name:'Marcar como lido',exact:true}).click();
 await page.getByText('Não foi possível confirmar a leitura.',{exact:false}).waitFor();assert.equal(posts,1);
 await page.getByRole('button',{name:'Atualizar avisos',exact:true}).click();await page.getByText('49 não lido(s) entre os 50 avisos exibidos.',{exact:true}).waitFor();assert.equal(posts,1);
 perder=false;await page.locator('#lista-avisos-atendimento > article').nth(1).getByRole('button',{name:'Marcar como lido',exact:true}).click();await page.getByText('48 não lido(s) entre os 50 avisos exibidos.',{exact:true}).waitFor();assert.equal(posts,2);
 await page.locator('#lista-avisos-atendimento > article').first().getByRole('button',{name:'Abrir conversa',exact:true}).click();assert.deepEqual(await page.evaluate(()=>aberto),[uuid(99)]);
 await page.getByRole('button',{name:'Ver avisos anteriores',exact:true}).click();await page.getByText('58 não lido(s) entre os 60 avisos exibidos.',{exact:true}).waitFor();assert.equal(await page.locator('#lista-avisos-atendimento > article').count(),60);assert.equal(await page.getByRole('button',{name:'Ver avisos anteriores',exact:true}).isVisible(),false);
 segurar=true;const chegou=new Promise(resolve=>iniciou=resolve);await page.getByRole('button',{name:'Atualizar avisos',exact:true}).click();await chegou;
 await page.evaluate(()=>{sessaoServicos={usuario:'outra-conta',token:'outro-token-ficticio'};controleSessao.alterar(sessaoServicos);limparAvisosAtendimento();});liberar();await page.waitForLoadState('networkidle');
 assert.equal(await page.locator('#lista-avisos-atendimento > article').count(),0);assert.equal(await page.locator('#resumo-avisos-atendimento').innerText(),'');assert.equal(posts,2);
 segurar=false;avisos=[];await page.getByRole('button',{name:'Atualizar avisos',exact:true}).click();await page.getByText('Você ainda não tem avisos de atendimento.',{exact:true}).waitFor();
 // Dados malformados não são mostrados como um aviso confiável.
 avisos=[{evento_id:uuid(1),tipo:'administracao',solicitacao_id:uuid(99),titulo:'INVÁLIDO',mensagem:'Mensagem suficientemente longa',status:'inventado',criado_em:'2026-11-26T12:00:00Z',lido_em:null}];
 await page.getByRole('button',{name:'Atualizar avisos',exact:true}).click();await page.getByText('Não foi possível consultar os avisos.',{exact:false}).waitFor();assert.equal(await page.getByText('INVÁLIDO',{exact:false}).count(),0);
});
