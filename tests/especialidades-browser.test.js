import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {chromium} from 'playwright-core';

test('especialidades em cadastro, edição, remoção e revisão móvel',async t=>{
 const server=createServer(async(req,res)=>{
  const arquivo=req.url==='/'?'index.html':req.url.slice(1);
  if(!/^(?:[-a-z0-9]+\.(?:js|html|css)|assets\/logo-oficial\.webp)$/.test(arquivo)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':arquivo.endsWith('.webp')?'image/webp':'text/html; charset=utf-8');
  if(arquivo==='config.js'){res.end("window.TRAMPOFACIL_SUPABASE={ambiente:'homologacao',url:'https://asdszqtpydiowgerxwee.supabase.co',chavePublicavel:'sb_publishable_teste',autenticacaoPronta:true}");return;}
  try{res.end(await readFile(new URL('../'+arquivo,import.meta.url)));}catch{res.writeHead(404).end();}
 }).listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());
 const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:320,height:900}});page.setDefaultTimeout(5000);
 const erros=[];page.on('pageerror',e=>erros.push(e.message));page.on('dialog',d=>d.accept());
 const uid='11111111-1111-4111-8111-111111111111';
 const p={usuario_id:uid,nome:'Profissional teste',telefone:'19999999999',cidade:'São João',servico:'Pedreiro',descricao:'Atendimento de teste',tipo_prestador:'pessoa_fisica',tipo_atividade:'regular',publicado:false,pausado:false,especialidades:['Pintor','Encanador']};
 const gravacoes=[];
 await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
  const req=route.request();
  if(req.url().includes('/rest/v1/profissionais?')){
   if(req.method()==='PATCH'){const dados=req.postDataJSON();gravacoes.push(dados);Object.assign(p,dados);return route.fulfill({json:[{usuario_id:uid,publicado:false,pausado:false}]});}
   return route.fulfill({json:[p]});
  }
  if(req.url().includes('/rpc/listar_perfis_revisao'))return route.fulfill({json:[{usuario_id:uid,solicitado_em:'2026-11-27T12:00:00Z',perfil:{nome:p.nome,cidade:p.cidade,servico:p.servico,descricao:p.descricao,tipo_prestador:p.tipo_prestador,tipo_atividade:p.tipo_atividade,especialidades:['Pintor','Encanador']}}]});
  if(req.url().includes('/rpc/aprovar_perfil_administrativo')){gravacoes.push(req.postDataJSON());return route.fulfill({json:1});}
  return route.fulfill({json:[]});
 });
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.waitForFunction(()=>typeof carregarPerfil==='function');
 const cadastro=await page.evaluate(()=>{
  const f=document.querySelector('[data-cadastro="profissional"]');
  for(const [c,v] of Object.entries({nome:'Teste',email:'teste@example.com',telefone:'19999999999',cidade:'São João',servico:'Pedreiro',tipo_prestador:'pessoa_fisica',tipo_atividade:'regular',especialidades:'Pintor\nEncanador'}))f.elements[c].value=v;
  return lerPerfil(f,'profissional').perfil;
 });assert.deepEqual(cadastro.especialidades,['Pintor','Encanador']);
 await page.evaluate(async usuario=>{iniciarSessao({token:'sessao-teste',usuario});mostrar('perfil');tipoPerfil.value='profissional';await carregarPerfil();},uid);
 assert.equal(await page.locator('#form-perfil [name="especialidades"]').inputValue(),'Pintor\nEncanador');
 await page.locator('#form-perfil [name="especialidades"]').fill('Pintor\nMarceneiro');await page.locator('#form-perfil button[type="submit"]').click();
 await page.getByText('Seu cadastro foi atualizado.',{exact:true}).waitFor();assert.deepEqual(gravacoes[0].especialidades,['Pintor','Marceneiro']);
 await page.locator('#form-perfil [name="especialidades"]').fill('');await page.locator('#form-perfil button[type="submit"]').click();
 await page.waitForFunction(()=>document.querySelector('#status-perfil').textContent==='Seu cadastro foi atualizado.');assert.deepEqual(gravacoes[1].especialidades,[]);
 await page.evaluate(async()=>{mostrar('revisao');await carregarRevisao();});
 await page.getByText('Especialidades: Pintor · Encanador',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Aprovar publicação de Profissional teste',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#status-revisao').textContent.includes('Publicação aprovada'));
 assert.deepEqual(gravacoes[2].esperado.especialidades,['Pintor','Encanador']);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(erros,[]);
});
