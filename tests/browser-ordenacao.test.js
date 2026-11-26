import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {once} from 'node:events';
import test from 'node:test';
import {chromium} from 'playwright-core';

test('ordena solicitações carregadas sem rede, preserva proposta e reinicia ao sair',async t=>{
  const arquivos=['index.html','config.js','ambiente.js','cadastro.js','valores.js','simulacao.js','simulador.js','sessao.js','servicos.js','avaliacoes.js','conversa.js','transicoes-contratacao.js','pagamentos.js','perfil.js'];
  const server=createServer(async(req,res)=>{
    const arquivo=req.url==='/'?'index.html':req.url.slice(1);
    if(!arquivos.includes(arquivo)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
    if(arquivo==='config.js'){res.end("window.TRAMPOFACIL_SUPABASE={ambiente:'homologacao',url:'https://asdszqtpydiowgerxwee.supabase.co',chavePublicavel:'sb_publishable_teste',autenticacaoPronta:true};");return;}
    res.end(await readFile(new URL('../'+arquivo,import.meta.url)));
  }).listen(0,'127.0.0.1');
  await once(server,'listening');t.after(()=>server.close());
  const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});
  t.after(()=>browser.close());
  const page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(5000);
  const usuario='11111111-1111-4111-8111-111111111111',outro='22222222-2222-4222-8222-222222222222';
  const pedidos=[
    {id:'33333333-3333-4333-8333-333333333333',titulo:'Serviço recente',status:'solicitada',cliente_usuario_id:outro,profissional_usuario_id:usuario,atualizado_em:'2026-11-26T12:00:00Z'},
    {id:'44444444-4444-4444-8444-444444444444',titulo:'Serviço concluído',status:'concluida',cliente_usuario_id:usuario,profissional_usuario_id:outro,atualizado_em:'2026-11-25T12:00:00Z'},
    {id:'55555555-5555-4555-8555-555555555555',titulo:'Orçamento antigo',status:'proposta',cliente_usuario_id:usuario,profissional_usuario_id:outro,atualizado_em:'2026-11-24T12:00:00Z'},
  ].map(p=>({...p,descricao:'Descrição fictícia de serviço para teste.',valor_centavos:10000}));
  let chamadas=0;
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
    chamadas++;assert.equal(route.request().method(),'GET');
    assert.equal(new URL(route.request().url()).pathname,'/rest/v1/solicitacoes');
    return route.fulfill({json:pedidos});
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.evaluate(usuario=>{iniciarSessao({usuario,token:'ficticio'});proteger('solicitacoes');},usuario);
  await page.getByRole('heading',{name:'Orçamento antigo',exact:true}).waitFor();
  const titulos=()=>page.locator('#lista-solicitacoes > article > h3').allTextContents();
  assert.deepEqual(await titulos(),['Serviço recente','Serviço concluído','Orçamento antigo']);
  const campo=page.locator('#lista-solicitacoes > article').filter({has:page.getByRole('heading',{name:'Serviço recente',exact:true})}).getByLabel('Valor da proposta (R$)');
  await campo.fill('123');
  await page.getByLabel('Ordenar solicitações carregadas',{exact:true}).selectOption('minha_acao');
  assert.deepEqual(await titulos(),['Serviço recente','Orçamento antigo','Serviço concluído']);
  assert.equal(await campo.inputValue(),'123');
  await page.getByLabel('Ordenar solicitações carregadas',{exact:true}).selectOption('antigas');
  assert.deepEqual(await titulos(),['Orçamento antigo','Serviço concluído','Serviço recente']);
  await page.locator('#busca-solicitacoes').fill('antigo');
  assert.equal(await page.locator('#lista-solicitacoes > article:visible').count(),1);
  assert.equal(chamadas,1);
  await page.getByRole('button',{name:'Limpar filtros',exact:true}).last().click();
  assert.deepEqual(await titulos(),['Serviço recente','Serviço concluído','Orçamento antigo']);
  assert.equal(await page.locator('#ordem-solicitacoes').inputValue(),'recentes');
  await page.locator('#ordem-solicitacoes').selectOption('antigas');
  await page.getByRole('button',{name:'Sair da conta',exact:true}).click();
  assert.equal(await page.locator('#ordem-solicitacoes').inputValue(),'recentes');
  assert.equal(await page.locator('#lista-solicitacoes > article').count(),0);
  assert.equal(chamadas,1);
});
