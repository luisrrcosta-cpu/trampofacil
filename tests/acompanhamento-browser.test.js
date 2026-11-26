import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';

test('andamento na tela recupera envio incerto, conclui atendimento e isola histórico entre sessões',async t=>{
 const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});t.after(()=>browser.close());
 const page=await browser.newPage();page.setDefaultTimeout(5000);page.on('dialog',d=>d.accept());
 const cliente='11111111-1111-4111-8111-111111111111',prof='22222222-2222-4222-8222-222222222222',id='33333333-3333-4333-8333-333333333333';
 let eventos=[],posts=0,perder=true,segurar=false,liberar,iniciou;
 const pedido={id,titulo:'Pedido fictício',cliente_usuario_id:cliente,profissional_usuario_id:prof};
 const item={solicitacao_id:id,titulo:pedido.titulo,motivo:'qualidade',descricao:'O serviço apresentou um problema.',criado_em:'2026-11-26T12:00:00Z',resposta:null};
 await page.route('https://teste.invalid/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname,dados=req.postDataJSON();
  if(path.endsWith('/listar_reclamacoes_administrativas'))return route.fulfill({json:[{...item,versao:eventos[0]?.versao||0,status:eventos[0]?.status||'aguardando_analise'}]});
  if(path.endsWith('/atualizar_acompanhamento_reclamacao')){
   posts++;assert.equal(dados.pedido_id,id);assert.equal(dados.versao_esperada,eventos[0]?.versao||0);assert.match(dados.operacao_id,/^[0-9a-f-]{36}$/);
   const novo={versao:dados.versao_esperada+1,status:dados.novo_status,mensagem:dados.mensagem,criado_em:'2026-11-26T13:00:00Z'};eventos.unshift(novo);
   if(perder)return route.abort('failed');return route.fulfill({json:{versao:novo.versao,status:novo.status}});
  }
  assert.ok(path.endsWith('/consultar_acompanhamento_reclamacao'));
  const resultado=eventos.filter(x=>x.versao<dados.antes_versao).slice(0,51);
  if(segurar){iniciou();await new Promise(resolve=>liberar=resolve);}
  return route.fulfill({json:resultado});
 });
 await page.setContent('<div id="solicitacoes"><div id="card"></div></div><button id="abrir-reclamacoes-admin"></button><section id="reclamacoes-admin"><button id="atualizar-reclamacoes-admin">Atualizar casos</button><div id="lista-reclamacoes-admin"></div><p id="status-reclamacoes-admin"></p><button id="anterior-reclamacoes-admin"></button><button id="proxima-reclamacoes-admin"></button></section>');
 await page.addScriptTag({content:`let sessaoServicos={usuario:'${cliente}',token:'ficticio'},versaoPedidos=1,ocupado=false;
 const elemento=id=>document.getElementById(id);const texto=(tag,valor)=>{const n=document.createElement(tag);n.textContent=valor;return n;};
 const botaoAcao=(valor,fn)=>{const b=texto('button',valor);b.addEventListener('click',fn);return b;};
 const bloquear=(s,b)=>s.querySelectorAll('button,input,select,textarea').forEach(n=>n.disabled=b);const proteger=()=>{};
 const enviar=(path,body)=>fetch('https://teste.invalid'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const exigirNovoLogin=()=>{sessaoServicos=undefined;elemento('card').replaceChildren();limparReclamacoesAdmin();};`});
 await page.addScriptTag({content:await readFile(new URL('../sessao.js',import.meta.url),'utf8')});await page.addScriptTag({content:'controleSessao.alterar(sessaoServicos);'});
 await page.addScriptTag({content:await readFile(new URL('../reclamacoes.js',import.meta.url),'utf8')});
 await page.evaluate(()=>carregarReclamacoesAdmin());
 await page.getByText('Situação: Aguardando análise.',{exact:true}).waitFor();
 await page.getByLabel('Resposta da administração').fill('<img src=x onerror=alert(1)> Análise iniciada.');
 await page.getByRole('button',{name:'Registrar atualização',exact:true}).click();await page.getByText('Não foi possível confirmar a atualização.',{exact:false}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Registrar atualização',exact:true}).isDisabled(),true);assert.equal(posts,1);
 await page.getByRole('button',{name:'Atualizar casos',exact:true}).click();await page.getByText('Situação: Em análise.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Consultar acompanhamento',exact:true}).click();await page.getByRole('heading',{name:'Em análise',exact:true}).waitFor();assert.equal(await page.locator('img').count(),0);assert.equal(posts,1);
 perder=false;await page.getByLabel('Próxima situação do atendimento').selectOption('concluida');await page.getByLabel('Resposta da administração').fill('Atendimento concluído após resposta às partes.');
 await page.getByRole('button',{name:'Registrar atualização',exact:true}).click();await page.getByText('Situação: Atendimento concluído.',{exact:true}).waitFor();assert.equal(posts,2);
 await page.evaluate(id=>{elemento('lista-reclamacoes-admin').replaceChildren();adicionarHistoricoReclamacao(elemento('card'),id);},id);
 // Percorre duas páginas sem repetir nem perder o item sentinela da página anterior.
 eventos=Array.from({length:60},(_,i)=>({versao:60-i,status:'em_analise',mensagem:'Atualização de teste número '+(60-i),criado_em:'2026-11-26T13:00:00Z'}));
 await page.getByRole('button',{name:'Consultar acompanhamento',exact:true}).click();await page.getByText('Atualização de teste número 60',{exact:true}).waitFor();assert.equal(await page.locator('#card article').count(),50);
 await page.getByRole('button',{name:'Ver atualizações anteriores',exact:true}).click();await page.getByText('Atualização de teste número 1',{exact:true}).waitFor();assert.equal(await page.locator('#card article').count(),60);
 assert.equal(await page.getByRole('button',{name:'Ver atualizações anteriores',exact:true}).isVisible(),false);
 segurar=true;const chegou=new Promise(resolve=>iniciou=resolve);await page.getByRole('button',{name:'Consultar acompanhamento',exact:true}).click();await chegou;
 await page.evaluate(()=>{sessaoServicos={usuario:'outra-conta',token:'outro-ficticio'};controleSessao.alterar(sessaoServicos);versaoPedidos++;elemento('card').replaceChildren();limparReclamacoesAdmin();});liberar();
 await page.waitForLoadState('networkidle');assert.equal(await page.getByText('Atualização de teste número 60',{exact:true}).count(),0);assert.equal(posts,2);
});
