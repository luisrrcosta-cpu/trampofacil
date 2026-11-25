import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {chromium} from 'playwright-core';

test('perfil preserva alterações ao cancelar atualização ou troca e reconhece gravação confirmada',async t=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const arquivos=new Set(['index.html',...[...html.matchAll(/<script\s+src="([^"]+)"\s+defer>/g)].map(m=>m[1])]);
 const server=createServer(async(req,res)=>{
  const p=req.url==='/'?'index.html':req.url.slice(1);
  if(!arquivos.has(p)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
  res.end(await readFile(new URL('../'+p,import.meta.url)));
 }).listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());
 const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});t.after(()=>browser.close());
 const page=await browser.newPage();page.setDefaultTimeout(5000);
 const usuario='11111111-1111-4111-8111-111111111111';
 const cliente={usuario_id:usuario,nome:'Cliente fictício',email:'qa@example.invalid',telefone:'11999999999',cidade:'Cidade'};
 const pro={usuario_id:usuario,nome:'Profissional fictício',telefone:'11999999999',cidade:'Cidade',servico:'Reparos',descricao:'Descrição salva',tipo_prestador:'mei',tipo_atividade:'regular',publicado:false,pausado:false};
 let consultas=0,gravacoes=0,aceitar=false,dialogos=0,falhar=false;
 page.on('dialog',async d=>{
  assert.equal(d.message(),'Descartar as alterações não salvas e carregar o cadastro novamente?');dialogos++;
  if(aceitar)await d.accept();else await d.dismiss();
 });
 await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
  const req=route.request(),url=new URL(req.url());
  assert.ok(['/rest/v1/clientes','/rest/v1/profissionais'].includes(url.pathname));
  assert.equal(req.headers().authorization,'Bearer teste-perfil');
  const registro=url.pathname.endsWith('/clientes')?cliente:pro;
  if(req.method()==='PATCH'){
   gravacoes++;if(falhar)return route.fulfill({status:503,json:{}});
   Object.assign(registro,req.postDataJSON());
   return route.fulfill({json:[{usuario_id:usuario}]});
  }
  assert.equal(req.method(),'GET');consultas++;return route.fulfill({json:[registro]});
 });
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 await page.evaluate(usuario=>{iniciarSessao({usuario,token:'teste-perfil'});mostrar('perfil');carregarPerfil();},usuario);
 const nome=page.locator('#form-perfil [name="nome"]');
 await page.getByText('Edite seus dados e salve.',{exact:false}).waitFor();
 await nome.fill('Cliente editado');
 await page.getByRole('button',{name:'Atualizar cadastro',exact:true}).click();
 assert.equal(await nome.inputValue(),'Cliente editado');assert.equal(consultas,1);assert.equal(dialogos,1);
 await page.locator('#tipo-perfil').selectOption('profissional');
 assert.equal(await page.locator('#tipo-perfil').inputValue(),'cliente');
 assert.equal(await nome.inputValue(),'Cliente editado');assert.equal(consultas,1);assert.equal(dialogos,2);
 await page.getByRole('button',{name:'Salvar meu cadastro',exact:true}).click();
 await page.getByText('Seu cadastro foi atualizado.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Atualizar cadastro',exact:true}).click();
 await page.getByText('Edite seus dados e salve.',{exact:false}).waitFor();
 assert.equal(dialogos,2);assert.equal(consultas,2);assert.equal(gravacoes,1);
 await nome.fill('Gravação não confirmada');falhar=true;
 await page.getByRole('button',{name:'Salvar meu cadastro',exact:true}).click();
 await page.getByText('Não foi possível confirmar a gravação.',{exact:false}).waitFor();
 await page.getByRole('button',{name:'Atualizar cadastro',exact:true}).click();
 assert.equal(await nome.inputValue(),'Gravação não confirmada');assert.equal(consultas,2);assert.equal(dialogos,3);
 aceitar=true;
 await page.locator('#tipo-perfil').selectOption('profissional');
 await page.getByText('Edite seus dados e salve.',{exact:false}).waitFor();
 assert.equal(await nome.inputValue(),'Profissional fictício');assert.equal(dialogos,4);assert.equal(consultas,3);
 aceitar=false;
 await page.locator('#form-perfil [name="tipo_prestador"]').selectOption('empresa');
 await page.getByRole('button',{name:'Atualizar cadastro',exact:true}).click();
 assert.equal(await page.locator('#form-perfil [name="tipo_prestador"]').inputValue(),'empresa');assert.equal(consultas,3);assert.equal(dialogos,5);
 // Sair da conta limpa a edição, sem pedir para manter dados privados.
 await page.evaluate(()=>iniciarSessao(undefined));
 assert.equal(await nome.inputValue(),'');assert.equal(await page.locator('#form-perfil').isVisible(),false);assert.equal(dialogos,5);
});
