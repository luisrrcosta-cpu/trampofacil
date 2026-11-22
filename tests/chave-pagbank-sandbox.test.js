import test from 'node:test';
import assert from 'node:assert/strict';
import {criarConsultaChaveSandbox} from '../server/chave-pagbank-sandbox.js';
test('consulta chave somente no sandbox, sem mutação nem propagação do token',async()=>{
 let chamadas=0;
 const servico=criarConsultaChaveSandbox({ambiente:'sandbox',token:'segredo-ficticio',fetchImpl:async(url,op)=>{
   chamadas++;assert.equal(url,'https://sandbox.api.pagseguro.com/public-keys/card');
   assert.equal(op.method,'GET');assert.equal(op.headers.Authorization,'Bearer segredo-ficticio');
   assert.equal(op.redirect,'error');assert.equal(op.credentials,'omit');
   return Response.json({public_key:'A'.repeat(400),outro:'dado privado'});
 }});
 assert.deepEqual(await servico.consultar(),{estado:'CHAVE_DISPONIVEL'});assert.equal(chamadas,1);
 assert.throws(()=>criarConsultaChaveSandbox({ambiente:'producao',token:'segredo-ficticio'}));
 assert.throws(()=>criarConsultaChaveSandbox({ambiente:'sandbox',token:'invalido\n'}));
});
test('recusa de credencial, chave ausente e erro não equivalem a autenticação aprovada',async()=>{
 for(const [status,estado] of [[401,'CREDENCIAL_RECUSADA'],[403,'CREDENCIAL_RECUSADA'],[404,'CHAVE_NAO_DISPONIVEL'],[500,'CONSULTA_INDISPONIVEL']]){
  const s=criarConsultaChaveSandbox({ambiente:'sandbox',token:'ficticio',fetchImpl:async()=>new Response('erro privado',{status})});
  assert.deepEqual(await s.consultar(),{estado});
 }
});
test('resposta malformada e falha de transporte retornam resultado mínimo',async()=>{
 for(const fetchImpl of [async()=>Response.json({public_key:'x'}),async()=>{throw Error('segredo privado')}]) {
  const s=criarConsultaChaveSandbox({ambiente:'sandbox',token:'ficticio',fetchImpl});
  assert.ok(['RESPOSTA_INVALIDA','CONSULTA_INDISPONIVEL'].includes((await s.consultar()).estado));
 }
});
