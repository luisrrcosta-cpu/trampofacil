import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {criarConsultaValidadorSandbox} from '../server/webhook-chave-sandbox.js';
test('chave webhook usa consulta fixa, cache limitado e verifica assinatura real',async()=>{
 const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 let chamadas=0,tempo=0;
 const consulta=criarConsultaValidadorSandbox({ambiente:'sandbox',token:'ficticio',agora:()=>tempo,fetchImpl:async(url,op)=>{
  chamadas++;assert.equal(url,'https://sandbox.api.pagseguro.com/public-keys/webhook');
  assert.equal(op.method,'GET');assert.equal(op.redirect,'error');assert.equal(op.credentials,'omit');
  if(chamadas>1)return new Response(null,{status:503});
  return Response.json({public_key:publicKey.export({type:'spki',format:'der'}).toString('base64')});
 }});
 const [a,b]=await Promise.all([consulta.obter(),consulta.obter()]);
 assert.equal(a,b);assert.equal(chamadas,1);
 const corpoBruto=Buffer.from('notificacao ficticia');
 assert.equal(a.validar({corpoBruto,assinaturas:sign('sha256',corpoBruto,privateKey).toString('base64')}),true);
 assert.equal(await consulta.obter(),a);
 tempo=600001;await assert.rejects(consulta.obter(),/indisponível/);
 assert.equal(chamadas,2,'chave expirada não é reutilizada silenciosamente');
});
test('chave ausente ou de cartão e credencial recusada falham sem dados internos',async()=>{
 const rsa=generateKeyPairSync('rsa',{modulusLength:2048}).publicKey.export({type:'spki',format:'der'}).toString('base64');
 for(const resposta of [()=>new Response('segredo',{status:401}),()=>Response.json({}),()=>Response.json({public_key:rsa})]){
  const c=criarConsultaValidadorSandbox({ambiente:'sandbox',token:'ficticio',fetchImpl:async()=>resposta()});
  await assert.rejects(c.obter(),e=>e.message==='Chave de webhook sandbox indisponível.');
 }
 assert.throws(()=>criarConsultaValidadorSandbox({ambiente:'producao',token:'ficticio'}));
});
