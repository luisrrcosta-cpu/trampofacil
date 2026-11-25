import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';

test('avaliação recupera resposta perdida, limita profissional e oculta autor divergente',async t=>{
 const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});t.after(()=>browser.close());
 const page=await browser.newPage();page.setDefaultTimeout(5000);page.on('dialog',d=>d.accept());
 const cliente='11111111-1111-4111-8111-111111111111',prof='22222222-2222-4222-8222-222222222222',id='33333333-3333-4333-8333-333333333333';
 let salvo,posts=0,divergente=false;
 await page.route('https://teste.invalid/**',async route=>{
  const req=route.request();
  if(req.method()==='POST'){
   posts++;assert.deepEqual(req.postDataJSON(),{solicitacao_id:id,nota:4});
   salvo={solicitacao_id:id,cliente_usuario_id:cliente,nota:4,criado_em:'2026-11-25T12:00:00Z'};
   return route.abort('failed');
  }
  return route.fulfill({json:salvo?[{...salvo,cliente_usuario_id:divergente?prof:cliente}]:[]});
 });
 await page.setContent('<main><div id="solicitacoes"><div id="card"></div></div></main>');
 await page.addScriptTag({content:`let sessaoServicos={usuario:'${cliente}',token:'ficticio'},versaoPedidos=1,ocupado=false;
 const elemento=id=>document.getElementById(id);
 const texto=(tag,valor)=>{const n=document.createElement(tag);n.textContent=valor;return n;};
 const botaoAcao=(valor,fn)=>{const b=texto('button',valor);b.addEventListener('click',fn);return b;};
 const bloquear=(s,b)=>s.querySelectorAll('button,input,select').forEach(n=>n.disabled=b);
 const enviar=(path,body,token,prefer,method='POST')=>fetch('https://teste.invalid'+path,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:body===undefined?undefined:JSON.stringify(body)});
 const exigirNovoLogin=()=>{sessaoServicos=undefined;document.getElementById('card').replaceChildren();};
 const pedido={id:'${id}',titulo:'Serviço fictício',status:'concluida',cliente_usuario_id:'${cliente}',profissional_usuario_id:'${prof}'};`});
 await page.addScriptTag({content:await readFile(new URL('../sessao.js',import.meta.url),'utf8')});
 await page.addScriptTag({content:'controleSessao.alterar(sessaoServicos);'});
 await page.addScriptTag({content:await readFile(new URL('../avaliacoes.js',import.meta.url),'utf8')});
 await page.evaluate(()=>adicionarAvaliacaoServico(document.getElementById('card'),pedido,true));
 await page.getByRole('button',{name:'Consultar avaliação do serviço',exact:true}).click();
 await page.getByText('Este serviço ainda não tem avaliação.',{exact:true}).waitFor();
 await page.getByLabel('Sua nota (1 a 5)').selectOption('4');
 await page.getByRole('button',{name:'Registrar avaliação',exact:true}).click();
 await page.getByText('Não foi possível confirmar o registro.',{exact:false}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Registrar avaliação',exact:true}).isVisible(),false);
 await page.getByRole('button',{name:'Consultar avaliação do serviço',exact:true}).click();
 await page.getByText('Avaliação registrada: 4 de 5.',{exact:false}).waitFor();assert.equal(posts,1);
 await page.evaluate(prof=>{sessaoServicos={usuario:prof,token:'ficticio-pro'};controleSessao.alterar(sessaoServicos);versaoPedidos++;document.getElementById('card').replaceChildren();adicionarAvaliacaoServico(document.getElementById('card'),pedido,false);},prof);
 await page.getByRole('button',{name:'Consultar avaliação do serviço',exact:true}).click();
 await page.getByText('Avaliação registrada: 4 de 5.',{exact:false}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Registrar avaliação',exact:true}).isVisible(),false);assert.equal(posts,1);
 divergente=true;
 await page.evaluate(()=>{document.getElementById('card').replaceChildren();adicionarAvaliacaoServico(document.getElementById('card'),pedido,false);});
 await page.getByRole('button',{name:'Consultar avaliação do serviço',exact:true}).click();
 await page.getByText('Não foi possível consultar a avaliação. Tente novamente.',{exact:true}).waitFor();
 assert.equal(await page.getByText('Avaliação registrada: 4 de 5.',{exact:false}).count(),0);
 await page.evaluate(()=>{document.getElementById('card').replaceChildren();adicionarAvaliacaoServico(document.getElementById('card'),{...pedido,status:'em_andamento'},true);});
 assert.equal(await page.getByRole('button',{name:'Consultar avaliação do serviço',exact:true}).count(),0);
});
