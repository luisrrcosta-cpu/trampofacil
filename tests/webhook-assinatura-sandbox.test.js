import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {criarValidadorWebhookSandbox} from '../server/webhook-assinatura-sandbox.js';
const par=()=>generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const {privateKey,publicKey}=par();
const chave=publicKey.export({format:'der',type:'spki'}).toString('base64');
const corpo=Buffer.from('{ "id": "evento-ficticio", "status": "PAID" }\n');
const assinatura=sign('sha256',corpo,privateKey).toString('base64');
const validador=criarValidadorWebhookSandbox({ambiente:'sandbox',chavePublicaBase64:chave});
test('assinatura ECDSA real valida somente os bytes originais',()=>{
 assert.equal(validador.validar({corpoBruto:corpo,assinaturas:assinatura}),true);
 assert.equal(validador.validar({corpoBruto:Buffer.from(JSON.stringify(JSON.parse(corpo))),assinaturas:assinatura}),false);
 assert.equal(validador.validar({corpoBruto:Buffer.from(corpo.toString().replace('PAID','DECLINED')),assinaturas:assinatura}),false);
 assert.equal(validador.validar({corpoBruto:corpo.toString(),assinaturas:assinatura}),false);
});
test('chave diferente e assinatura ausente ou inválida são recusadas',()=>{
 const outra=criarValidadorWebhookSandbox({ambiente:'sandbox',chavePublicaBase64:par().publicKey.export({format:'der',type:'spki'}).toString('base64')});
 assert.equal(outra.validar({corpoBruto:corpo,assinaturas:assinatura}),false);
 for(const valor of [undefined,'','!!!',assinatura.slice(0,-1),'AAAA']) {
  assert.equal(validador.validar({corpoBruto:corpo,assinaturas:valor}),false);
 }
});
test('rotação aceita uma assinatura válida entre valores inválidos',()=>{
 assert.equal(validador.validar({corpoBruto:corpo,assinaturas:['!!!',assinatura]}),true);
 assert.equal(validador.validar({corpoBruto:corpo,assinaturas:'AAAA, '+assinatura}),true);
});
test('limites impedem trabalho ilimitado e produção não é configurável',()=>{
 for(const corpoBruto of [new Uint8Array(0),new Uint8Array(65537),{}]) {
  assert.equal(validador.validar({corpoBruto,assinaturas:assinatura}),false);
 }
 assert.equal(validador.validar({corpoBruto:corpo,assinaturas:Array(9).fill(assinatura)}),false);
 assert.equal(validador.validar({corpoBruto:corpo,assinaturas:'A'.repeat(8193)}),false);
 assert.throws(()=>criarValidadorWebhookSandbox({ambiente:'producao',chavePublicaBase64:chave}));
 assert.throws(()=>criarValidadorWebhookSandbox({ambiente:'sandbox',chavePublicaBase64:'AAAA'}));
 const rsa=generateKeyPairSync('rsa',{modulusLength:2048}).publicKey.export({format:'der',type:'spki'}).toString('base64');
 assert.throws(()=>criarValidadorWebhookSandbox({ambiente:'sandbox',chavePublicaBase64:rsa}));
});
