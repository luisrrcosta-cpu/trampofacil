import test from 'node:test';
import assert from 'node:assert/strict';
import {criarConsultaPagBankSandbox} from '../server/pagbank-sandbox.js';
const esperado={cobrancaId:'CHAR_1234-ABCD',referenciaEsperada:'tentativa-teste',valorEsperadoCentavos:15000};
const dados={id:esperado.cobrancaId,reference_id:esperado.referenciaEsperada,status:'PAID',
  amount:{value:15000,currency:'BRL',summary:{total:15000,paid:15000,refunded:0}},
  customer:{tax_id:'não retornar'},payment_method:{card:{number:'não retornar'}}};
const configurar=fetchImpl=>criarConsultaPagBankSandbox({ambiente:'sandbox',token:'token-ficticio',fetchImpl});
test('consulta usa apenas GET sandbox com limites de transporte e retorno mínimo',async()=>{
  let chamadas=0;
  const cliente=configurar(async(url,opcoes)=>{
    chamadas++; assert.equal(url,'https://sandbox.api.pagseguro.com/charges/CHAR_1234-ABCD');
    assert.equal(opcoes.method,'GET'); assert.equal(opcoes.redirect,'error');
    assert.equal(opcoes.cache,'no-store'); assert.equal(opcoes.credentials,'omit');
    assert.equal(opcoes.headers.Authorization,'Bearer token-ficticio');
    assert.ok(opcoes.signal instanceof AbortSignal);
    return Response.json(dados);
  });
  assert.deepEqual(await cliente.consultar(esperado),{ambiente:'sandbox',cobrancaId:esperado.cobrancaId,
    statusProvedor:'PAID',valorCentavos:15000,pagoCentavos:15000,devolvidoCentavos:0});
  assert.equal(chamadas,1);
  assert.deepEqual(Object.keys(cliente),['consultar']);
});
test('produção, credencial inválida e identificador com caminho externo são recusados antes da rede',async()=>{
  for(const ambiente of ['producao',undefined,'teste']) assert.throws(()=>criarConsultaPagBankSandbox({ambiente,token:'x'}));
  for(const token of ['', 'Bearer x','x\nsegredo']) assert.throws(()=>criarConsultaPagBankSandbox({ambiente:'sandbox',token}));
  let chamadas=0; const cliente=configurar(async()=>{chamadas++;});
  for(const alteracao of [{cobrancaId:'https://externo.invalid'},{cobrancaId:'CHAR_../segredo'},
    {referenciaEsperada:''},{valorEsperadoCentavos:1.5},{valorEsperadoCentavos:0}]) {
    await assert.rejects(cliente.consultar({...esperado,...alteracao}));
  }
  assert.equal(chamadas,0);
});
test('identidade, valor, moeda, estado desconhecido e resumo incoerente não conciliam',async()=>{
  for(const alteracao of [{id:'CHAR_OUTRA'},{reference_id:'outra-tentativa'},{status:'NOVO_ESTADO'},
    {amount:{...dados.amount,value:14000}},{amount:{...dados.amount,currency:'USD'}},
    {amount:{...dados.amount,summary:{total:15000,paid:14000,refunded:0}}},
    {amount:{...dados.amount,summary:{total:15000,paid:15000,refunded:15001}}}]) {
    await assert.rejects(configurar(async()=>Response.json({...dados,...alteracao})).consultar(esperado));
  }
});
test('devolução parcial é preservada e erro do provedor não vaza nem repete consulta',async()=>{
  const parcial={...dados,amount:{...dados.amount,summary:{total:15000,paid:15000,refunded:5000}}};
  assert.equal((await configurar(async()=>Response.json(parcial)).consultar(esperado)).devolvidoCentavos,5000);
  let chamadas=0;
  await assert.rejects(configurar(async()=>{chamadas++;throw new Error('token-ficticio e dados privados');}).consultar(esperado),
    erro=>erro.message==='Não foi possível conferir a cobrança de teste.');
  assert.equal(chamadas,1);
});
