import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {criarReceptorWebhookSandbox} from '../server/webhook-receptor-sandbox.js';
import {criarValidadorWebhookSandbox} from '../server/webhook-assinatura-sandbox.js';
const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const validador=criarValidadorWebhookSandbox({ambiente:'sandbox',chavePublicaBase64:publicKey.export({format:'der',type:'spki'}).toString('base64')});
const url='https://asdszqtpydiowgerxwee.supabase.co/functions/v1/webhook-pagbank-sandbox';
const raw=JSON.stringify({charges:[{id:'CHAR_ficticia',status:'PAID',amount:{value:10000}}],customer:{email:'pessoal@example.invalid'}});
const request=(body=raw,extras={})=>new Request(url,{method:'POST',headers:{'Content-Type':'application/json','x-payload-signature':sign('sha256',Buffer.from(body),privateKey).toString('base64')},body,...extras});
let db;
before(async()=>{db=new PGlite();await db.exec('create schema private; create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema private to service_role;');
 await db.exec(await readFile(new URL('../supabase/homologacao/receber-webhook-sandbox.sql',import.meta.url),'utf8'));});
after(async()=>db?.close());
const registrar=d=>db.transaction(async tx=>{await tx.exec('set local role service_role');return (await tx.query('select private.receber_webhook_sandbox($1,$2) as novo',[d.hash,d.cobrancas])).rows[0].novo;});
test('recepção autenticada ignora dados pessoais e status, grava uma vez após resposta perdida',async()=>{
 let falhar=true;const dados=[];
 const handler=criarReceptorWebhookSandbox({ambiente:'sandbox',obterValidador:async()=>validador,registrar:async d=>{
  dados.push(d);await registrar(d);if(falhar){falhar=false;throw Error('falha apos commit');}
 }});
 assert.equal((await handler(request())).status,503);
 const r=await handler(request());assert.equal(r.status,202);
 assert.deepEqual(await r.json(),{recebida:true,financeiroProcessado:false});
 assert.deepEqual(Object.keys(dados[0]).sort(),['cobrancas','hash']);
 assert.deepEqual(dados[0].cobrancas,['CHAR_ficticia']);
 const rows=(await db.query('select * from private.recebimentos_webhook_sandbox')).rows;
 assert.equal(rows.length,1);assert.equal(rows[0].financeiro_processado,false);
 assert.equal(rows[0].estado,'aguardando_conferencia');
 assert.ok(!JSON.stringify(rows).includes('pessoal@example'));
});
test('assinaturas falsas ou corpo adulterado não gravam',async()=>{
 let registros=0;
 const h=criarReceptorWebhookSandbox({ambiente:'sandbox',obterValidador:async()=>validador,registrar:async()=>{registros++;}});
 assert.equal((await h(request(raw,{headers:{'Content-Type':'application/json'}}))).status,401);
 assert.equal((await h(request(raw,{headers:{'Content-Type':'application/json','x-payload-signature':'AAAA'}}))).status,401);
 assert.equal(registros,0);
});
test('rotas, métodos, mídia e limites são recusados sem consulta de chave',async()=>{
 let chamadas=0;
 const h=criarReceptorWebhookSandbox({ambiente:'sandbox',obterValidador:async()=>{chamadas++;return validador;},registrar});
 assert.equal((await h(new Request(url))).status,405);
 assert.equal((await h(new Request(url+'?token=nao'))).status,404);
 assert.equal((await h(request(raw,{headers:{'Content-Type':'text/plain','x-payload-signature':'AAAA'}}))).status,415);
 assert.equal((await h(request('A'.repeat(65537)))).status,413);
 const lento=new ReadableStream({start(){}});
 const hCurto=criarReceptorWebhookSandbox({ambiente:'sandbox',obterValidador:async()=>validador,registrar,timeoutMs:5});
 assert.equal((await hCurto(new Request(url,{method:'POST',body:lento,duplex:'half',headers:{'Content-Type':'application/json','x-payload-signature':'AAAA'}}))).status,408);
 assert.equal(chamadas,0);
});
test('falha da chave, JSON inválido e cobranças não suportadas não gravam',async()=>{
 let registros=0;const registrar=async()=>{registros++;};
 const h=criarReceptorWebhookSandbox({ambiente:'sandbox',obterValidador:async()=>validador,registrar});
 assert.equal((await h(request('{invalido'))).status,400);
 for(const payload of [{charges:[]},{charges:[{id:'https://externo'}]},{charges:[{id:'CHAR_a'},{id:'CHAR_a'}]}]){
  assert.equal((await h(request(JSON.stringify(payload)))).status,422);
 }
 const falha=criarReceptorWebhookSandbox({ambiente:'sandbox',obterValidador:async()=>{throw Error('privado')},registrar});
 assert.equal((await falha(request())).status,503);assert.equal(registros,0);
 assert.throws(()=>criarReceptorWebhookSandbox({ambiente:'producao',obterValidador:async()=>validador,registrar}));
});
test('replays idênticos têm unicidade durável e clientes não acessam fila',async()=>{
 const hash=createHash('sha256').update('outro corpo').digest('hex');
 assert.equal(await registrar({hash,cobrancas:['CHAR_outro']}),true);
 assert.equal(await registrar({hash,cobrancas:['CHAR_outro']}),false);
 await assert.rejects(registrar({hash,cobrancas:['CHAR_divergente']}));
 await assert.rejects(registrar({hash:'f'.repeat(64),cobrancas:['CHAR_a','CHAR_a']}));
 for(const role of ['anon','authenticated']){
  await assert.rejects(db.transaction(async tx=>{await tx.exec('set local role '+role);await tx.query('select * from private.recebimentos_webhook_sandbox');}));
  await assert.rejects(db.transaction(async tx=>{await tx.exec('set local role '+role);await tx.query("select private.receber_webhook_sandbox($1,$2)",['e'.repeat(64),['CHAR_a']]);}));
 }
 for(const sql of ['delete from private.recebimentos_webhook_sandbox','update private.recebimentos_webhook_sandbox set financeiro_processado=true']){
  await assert.rejects(db.transaction(async tx=>{await tx.exec('set local role service_role');await tx.exec(sql);}));
 }
});
