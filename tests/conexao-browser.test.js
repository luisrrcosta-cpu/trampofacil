import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {chromium} from 'playwright-core';

test('aviso de conexão mantém preenchimento e foco e não reenvia ao reconectar',async t=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const arquivos=new Set(['index.html',...[...html.matchAll(/<script\s+src="([^"]+)"\s+defer>/g)].map(m=>m[1])]);
 const server=createServer(async(req,res)=>{
  const p=req.url==='/'?'index.html':req.url.slice(1);
  if(!arquivos.has(p)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
  res.end(await readFile(new URL('../'+p,import.meta.url)));
 }).listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());
 const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});t.after(()=>browser.close());
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage();page.setDefaultTimeout(5000);
 let chamadas=0;
 await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async r=>{chamadas++;await r.fulfill({status:503,json:{}});});
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 const aviso=page.locator('#status-conexao');
 assert.equal(await aviso.textContent(),'');assert.equal(await aviso.getAttribute('role'),'status');
 await page.getByRole('button',{name:'Sou Cliente',exact:true}).click();
 const nome=page.locator('#cliente input[name="nome"]');await nome.fill('Nome fictício');
 await context.setOffline(true);
 await aviso.filter({hasText:'Sem conexão.'}).waitFor();
 assert.equal(await nome.inputValue(),'Nome fictício');
 assert.equal(await nome.evaluate(n=>document.activeElement===n),true);
 assert.equal(await page.locator('#cliente').isVisible(),true);
 await context.setOffline(false);
 await aviso.filter({hasText:'Conexão disponível novamente.'}).waitFor();
 assert.equal(await nome.inputValue(),'Nome fictício');
 assert.equal(await nome.evaluate(n=>document.activeElement===n),true);
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 assert.equal(chamadas,0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 // O estado de conexão não deve transportar dados do formulário para outra página.
 page.once('dialog',d=>d.accept());
 await page.locator('#cliente').getByRole('button',{name:'Voltar',exact:true}).click();
 await page.getByRole('button',{name:'Sou Cliente',exact:true}).click();
 assert.equal(await nome.inputValue(),'');assert.equal(chamadas,0);
});
