import test from 'node:test';
import assert from 'node:assert/strict';
import {criarConsultaCheckoutSandbox} from '../server/consultar-checkout-sandbox.js';
const id='89934739-87f9-4c53-b8ca-8b757dd81f53';
const contexto={id,referencia:'tf-sandbox-'+id,valorCentavos:100,checkoutId:'CHEC_ficticio'};
const resposta=()=>({id:contexto.checkoutId,reference_id:contexto.referencia,status:'ACTIVE',items:[{reference_id:id,quantity:1,unit_amount:100}],customer:{tax_id:'nao-propagar'},payments:[{status:'PAID'}],links:[{rel:'PAY',href:'https://externo.invalid'}]});
test('consulta fixa GET sandbox confere contexto e não devolve dados financeiros/pessoais',async()=>{
 let chamadas=0;
 const api=criarConsultaCheckoutSandbox({ambiente:'sandbox',token:'ficticio',fetchImpl:async(u,op)=>{
  chamadas++;assert.equal(u,'https://sandbox.api.pagseguro.com/checkouts/CHEC_ficticio');
  assert.equal(op.method,'GET');assert.equal(op.redirect,'error');assert.equal(op.credentials,'omit');
  assert.equal(op.cache,'no-store');assert.equal(op.body,undefined);assert.ok(op.signal instanceof AbortSignal);
  return Response.json(resposta());
 }});
 const r=await api.consultar(contexto);
 assert.deepEqual(r,{ambiente:'sandbox',checkoutId:'CHEC_ficticio',statusCheckout:'ACTIVE',valorCentavos:100,pagamentoConfirmado:false,liberarRepasse:false});
 assert.equal(Object.isFrozen(r),true);assert.equal(chamadas,1);
});
test('entrada inválida e produção são bloqueadas sem chamada externa',async()=>{
 let n=0;const api=criarConsultaCheckoutSandbox({ambiente:'sandbox',token:'ficticio',fetchImpl:async()=>{n++;}});
 for(const v of [{checkoutId:null},{checkoutId:'CHEC_a/../b'},{checkoutId:'https://externo.invalid'},{checkoutId:'CHAR_a'},{referencia:'outra'},{id:3},{valorCentavos:99},{valorCentavos:100.1}])await assert.rejects(api.consultar({...contexto,...v}));
 assert.equal(n,0);
 for(const config of [{ambiente:'producao'},{token:'invalido\n'},{timeoutMs:0}])assert.throws(()=>criarConsultaCheckoutSandbox({ambiente:'sandbox',token:'ficticio',...config}));
});
test('divergências de identidade e valores são recusadas; estado de checkout nunca equivale a pagamento',async()=>{
 for(const alterar of [d=>({...d,id:'CHEC_outro'}),d=>({...d,reference_id:'outra'}),d=>({...d,status:'PAID'}),d=>({...d,items:[]}),d=>({...d,items:[{reference_id:id,quantity:2,unit_amount:100}]}),d=>({...d,items:[{reference_id:'outro',quantity:1,unit_amount:100}]}),d=>({...d,additional_amount:1}),d=>({...d,discount_amount:1}),d=>({...d,shipping:{}}),d=>({...d,recurrence_plan:{}}),()=>null]){
  const api=criarConsultaCheckoutSandbox({ambiente:'sandbox',token:'ficticio',fetchImpl:async()=>Response.json(alterar(resposta()))});
  await assert.rejects(api.consultar(contexto));
 }
 for(const status of ['INACTIVE','EXPIRED']){
  const api=criarConsultaCheckoutSandbox({ambiente:'sandbox',token:'ficticio',fetchImpl:async()=>Response.json({...resposta(),status})});
  const r=await api.consultar(contexto);assert.equal(r.statusCheckout,status);assert.equal(r.pagamentoConfirmado,false);assert.equal(r.liberarRepasse,false);
 }
});
test('404, erro do provedor ou transporte não provam inexistência, não repetem envio e ocultam detalhes',async()=>{
 for(const fetchImpl of [async()=>new Response('privado',{status:404}),async()=>new Response('token privado',{status:401}),async()=>{throw Error('segredo')},async()=>new Response('{invalido',{status:200})]){
  let n=0;const api=criarConsultaCheckoutSandbox({ambiente:'sandbox',token:'ficticio',fetchImpl:async(...args)=>{n++;return fetchImpl(...args);}});
  await assert.rejects(api.consultar(contexto),{message:'Não foi possível conferir o checkout de teste.'});assert.equal(n,1);
 }
});
