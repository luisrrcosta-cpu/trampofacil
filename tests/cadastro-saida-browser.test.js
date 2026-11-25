import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {chromium} from 'playwright-core';

test('voltar do cadastro pede confirmação apenas com dados e preserva formulário ao cancelar',async t=>{
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
 const page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(5000);
 let aceitar=false,dialogos=0,externas=0;
 page.on('dialog',async dialog=>{
  dialogos++;assert.equal(dialog.type(),'confirm');
  assert.equal(dialog.message(),'Sair do cadastro e descartar os dados preenchidos?');
  if(aceitar)await dialog.accept();else await dialog.dismiss();
 });
 await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{externas++;await route.fulfill({status:503,json:{}});});
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 // Cliente vazio: voltar imediatamente, sem perguntar.
 await page.getByRole('button',{name:'Sou Cliente',exact:true}).click();
 await page.locator('#cliente').getByRole('button',{name:'Voltar',exact:true}).click();
 assert.equal(await page.locator('#inicio').isVisible(),true);assert.equal(dialogos,0);
 await page.getByRole('button',{name:'Sou Cliente',exact:true}).click();
 await page.locator('#cliente').getByLabel('E-mail',{exact:true}).fill('qa@example.invalid');
 await page.locator('#cliente').getByRole('button',{name:'Voltar',exact:true}).click();
 assert.equal(await page.locator('#cliente').isVisible(),true);
 assert.equal(await page.locator('#cliente').getByLabel('E-mail',{exact:true}).inputValue(),'qa@example.invalid');
 assert.equal(dialogos,1);
 aceitar=true;
 await page.locator('#cliente').getByRole('button',{name:'Voltar',exact:true}).click();
 assert.equal(await page.locator('#inicio').isVisible(),true);
 await page.getByRole('button',{name:'Sou Cliente',exact:true}).click();
 assert.equal(await page.locator('#cliente').getByLabel('E-mail',{exact:true}).inputValue(),'');
 await page.locator('#cliente').getByRole('button',{name:'Voltar',exact:true}).click();
 assert.equal(dialogos,2);
 // Alterar só a modalidade também conta como preenchimento.
 await page.getByRole('button',{name:'Sou Profissional',exact:true}).click();
 await page.locator('#profissional').getByRole('button',{name:'Voltar',exact:true}).click();
 assert.equal(dialogos,2);
 await page.getByRole('button',{name:'Sou Profissional',exact:true}).click();
 await page.locator('#profissional select[name="tipo_prestador"]').selectOption('mei');
 aceitar=false;
 await page.locator('#profissional').getByRole('button',{name:'Voltar',exact:true}).click();
 assert.equal(await page.locator('#profissional').isVisible(),true);
 assert.equal(await page.locator('#profissional select[name="tipo_prestador"]').inputValue(),'mei');
 await page.getByLabel('Descrição do serviço (opcional)',{exact:true}).fill('Reparos fictícios');
 await page.locator('#profissional').getByRole('button',{name:'Voltar',exact:true}).click();
 assert.equal(await page.getByLabel('Descrição do serviço (opcional)',{exact:true}).inputValue(),'Reparos fictícios');
 assert.equal(await page.locator('#contador-perfil-profissional').textContent(),'17/1000 caracteres');
 aceitar=true;
 await page.locator('#profissional').getByRole('button',{name:'Voltar',exact:true}).click();
 await page.getByRole('button',{name:'Sou Profissional',exact:true}).click();
 assert.equal(await page.locator('#profissional select[name="tipo_prestador"]').inputValue(),'');
 assert.equal(await page.getByLabel('Descrição do serviço (opcional)',{exact:true}).inputValue(),'');
 assert.equal(await page.locator('#contador-perfil-profissional').textContent(),'0/1000 caracteres');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 assert.equal(externas,0);
});
