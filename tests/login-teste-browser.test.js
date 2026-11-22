import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {once} from 'node:events';
import test from 'node:test';
import {chromium} from 'playwright-core';

test('página isolada valida OTP sem criar conta, guardar token ou liberar aplicativo',async t=>{
  const arquivos=['login-teste.html','login-teste.js','login-teste-core.js','login-teste.css','config.js'];
  const server=createServer(async(req,res)=>{
    const arquivo=req.url.slice(1);
    if(!arquivos.includes(arquivo)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':arquivo.endsWith('.css')?'text/css':'text/html');
    res.end(await readFile(new URL('../'+arquivo,import.meta.url)));
  }).listen(0,'127.0.0.1');
  await once(server,'listening');t.after(()=>server.close());
  const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});
  t.after(()=>browser.close());
  const page=await browser.newPage();page.setDefaultTimeout(5000);
  const chamadas=[];const erros=[];
  page.on('pageerror',e=>erros.push(e.message));
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
    const req=route.request();const path=new URL(req.url()).pathname;
    chamadas.push({path,body:req.postDataJSON()});
    const dados=path.endsWith('/verify')?{access_token:'sessao-ficticia',refresh_token:'refresh-ficticio'}:
      path.endsWith('/user')?{id:'00000000-0000-4000-8000-000000000001',email:'teste@example.com'}:{};
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(dados)});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/login-teste.html`);
  assert.equal(chamadas.length,0,'não envia código automaticamente');
  await page.getByLabel('Seu e-mail',{exact:true}).fill('teste@example.com');
  await page.getByRole('button',{name:'Enviar código de teste'}).click();
  await page.getByRole('status').getByText('Pedido enviado.',{exact:false}).waitFor();
  assert.deepEqual(chamadas[0].body,{email:'teste@example.com',create_user:false});
  await page.getByRole('button',{name:'Enviar código de teste'}).click();
  assert.equal(chamadas.length,1,'reenvio imediato bloqueado');
  await page.getByLabel('Código recebido por e-mail').fill('12345678');
  await page.getByRole('button',{name:'Verificar acesso'}).click();
  await page.getByRole('status').getByText('Teste aprovado:',{exact:false}).waitFor();
  assert.equal(chamadas[1].body.token,'12345678');
  assert.deepEqual(chamadas.map(c=>c.path),['/auth/v1/otp','/auth/v1/verify','/auth/v1/user','/auth/v1/logout']);
  assert.equal(await page.getByLabel('Código recebido por e-mail').inputValue(),'');
  assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
  assert.equal(await page.evaluate(()=>window.TRAMPOFACIL_SUPABASE.autenticacaoPronta),false);
  assert.ok(!((await page.locator('body').innerText()).includes('sessao-ficticia')));
  assert.deepEqual(erros,[]);
});
