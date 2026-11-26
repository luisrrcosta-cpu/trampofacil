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
  let chamadas=0, falhar=false;
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
    chamadas++;assert.equal(route.request().method(),'GET');
    assert.equal(new URL(route.request().url()).pathname,'/rest/v1/solicitacoes');
    return route.fulfill(falhar ? {status:500,json:{}} : {json:pedidos});
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.evaluate(usuario=>{iniciarSessao({usuario,token:'ficticio'});proteger('solicitacoes');},usuario);
  await page.getByRole('heading',{name:'Orçamento antigo',exact:true}).waitFor();
  const titulos=()=>page.locator('#lista-solicitacoes > article > h3').allTextContents();
  assert.deepEqual(await titulos(),['Serviço recente','Serviço concluído','Orçamento antigo']);
  const campo=page.locator('#lista-solicitacoes > article[data-solicitacao-id="33333333-3333-4333-8333-333333333333"] [data-valor-inicial-proposta]');
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
  // Atualizar só descarta a proposta depois de confirmação e consulta bem-sucedida.
  page.once('dialog',dialog=>dialog.dismiss());
  await page.locator('#recarregar-solicitacoes').click();
  assert.equal(chamadas,1);assert.equal(await campo.inputValue(),'123');
  falhar=true;
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#recarregar-solicitacoes').click();
  await page.getByText('Não foi possível carregar as solicitações. Tente atualizar.',{exact:true}).waitFor();
  assert.equal(chamadas,2);assert.equal(await campo.inputValue(),'123');
  falhar=false;
  page.once('dialog',dialog=>dialog.accept());
  const respostaAtualizacao=page.waitForResponse(r=>r.url().includes('/rest/v1/solicitacoes')&&r.status()===200);
  await page.locator('#recarregar-solicitacoes').click();await respostaAtualizacao;
  await page.waitForFunction(()=>!document.getElementById('recarregar-solicitacoes').disabled);
  assert.equal(await campo.inputValue(),'');assert.equal(chamadas,3);
  // Sem edição, atualizar não pede confirmação.
  const dialogoInesperado=()=>{throw new Error('Não deve confirmar proposta vazia');};
  page.on('dialog',dialogoInesperado);
  const respostaSemEdicao=page.waitForResponse(r=>r.url().includes('/rest/v1/solicitacoes'));
  await page.locator('#recarregar-solicitacoes').click();await respostaSemEdicao;
  await page.waitForFunction(()=>!document.getElementById('recarregar-solicitacoes').disabled);
  page.removeListener('dialog',dialogoInesperado);
  // Abrir histórico ou sair da lista também deve proteger a edição.
  await campo.fill('321');
  const cardRecente=page.locator('#lista-solicitacoes > article').filter({has:page.getByRole('heading',{name:'Serviço recente',exact:true})});
  page.once('dialog',dialog=>dialog.dismiss());
  await cardRecente.getByRole('button',{name:'Ver histórico e mensagens',exact:true}).click();
  assert.equal(await page.locator('#solicitacoes').isVisible(),true);
  assert.equal(await campo.inputValue(),'321');assert.equal(chamadas,4);
  const inicio=page.locator('#solicitacoes [data-pagina="inicio"]');
  page.once('dialog',dialog=>dialog.dismiss());
  await inicio.click();
  assert.equal(await page.locator('#solicitacoes').isVisible(),true);
  assert.equal(await campo.inputValue(),'321');assert.equal(chamadas,4);
  await page.locator('#ordem-solicitacoes').selectOption('antigas');
  page.once('dialog',dialog=>dialog.accept());
  await inicio.click();
  assert.equal(await page.locator('#inicio').isVisible(),true);
  assert.equal(await campo.inputValue(),'');assert.equal(chamadas,4);
  // Recarga automática conserva edição somente na mesma versão do pedido.
  await page.evaluate(()=>proteger('solicitacoes'));
  await page.waitForFunction(()=>!document.getElementById('recarregar-solicitacoes').disabled);
  await campo.fill('456');
  await page.evaluate(()=>carregarPedidos('Atualização após outra ação.'));
  assert.equal(await campo.inputValue(),'456');assert.equal(chamadas,6);
  // Versão alterada pelo servidor descarta o rascunho antigo.
  pedidos[0].atualizado_em='2026-11-26T12:01:00Z';
  await page.evaluate(()=>carregarPedidos());
  assert.equal(await campo.inputValue(),'');assert.equal(chamadas,7);
  // Transição de estado não deve recuperar um orçamento em tela incompatível.
  await campo.fill('789');pedidos[0].status='aceita';
  await page.evaluate(()=>carregarPedidos());
  assert.equal(await campo.count(),0);assert.equal(chamadas,8);
  await page.evaluate(()=>iniciarSessao(undefined));
  assert.equal(await page.locator('#ordem-solicitacoes').inputValue(),'recentes');
  assert.equal(await page.locator('#lista-solicitacoes > article').count(),0);
  assert.equal(chamadas,8);
});
