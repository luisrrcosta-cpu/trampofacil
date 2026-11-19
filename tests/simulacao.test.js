import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
const simular = runInNewContext((await readFile(new URL('../simulacao.js',import.meta.url),'utf8'))+';simularPagamento');

test('referência de 4% preserva 90 reais ao profissional e 10 à plataforma',()=>{
  const r=simular({valorCentavos:10000,forma:'credito_avista'});
  assert.equal(r.totalCentavos,10417);assert.equal(r.tarifaEstimadaCentavos,417);
  assert.equal(r.profissionalCentavos,9000);assert.equal(r.comissaoCentavos,1000);
  assert.equal(r.impostosCalculados,false);assert.equal(r.taxasOnlineConfirmadas,false);assert.equal(r.somenteSimulacao,true);
});
test('12% em até dez parcelas é taxa total e parcelas somam exatamente o total',()=>{
  const r=simular({valorCentavos:10000,forma:'credito_parcelado',parcelas:10});
  assert.equal(r.totalCentavos,11364);assert.equal(r.tarifaEstimadaCentavos,1364);
  assert.equal(r.parcelasCentavos.filter(v=>v===1137).length,4);
  assert.equal(r.parcelasCentavos.filter(v=>v===1136).length,6);
  assert.equal(r.parcelasCentavos.reduce((a,b)=>a+b,0),11364);
});
test('arredondamento fica separado da comissão e todos os centavos conciliam',()=>{
  for(const base of [100,101,109,1999,10000,10001,99999999,100000000]) {
    for(let parcelas=1;parcelas<=10;parcelas++){
      const r=simular({valorCentavos:base,forma:parcelas===1?'credito_avista':'credito_parcelado',parcelas});
      assert.equal(r.profissionalCentavos+r.comissaoCentavos,base);
      assert.equal(r.profissionalCentavos+r.comissaoCentavos+r.tarifaEstimadaCentavos+r.ajusteArredondamentoCentavos,r.totalCentavos);
      assert.ok(r.ajusteArredondamentoCentavos>=0 && r.ajusteArredondamentoCentavos<=1);
      assert.equal(r.parcelasCentavos.reduce((a,b)=>a+b,0),r.totalCentavos);
    }
  }
});
test('não presume taxas para Pix, débito ou parcelamento fora das referências',()=>{
  for(const forma of ['pix','debito','boleto','credito',null])assert.throws(()=>simular({valorCentavos:10000,forma}));
  for(const parcelas of [0,1,11,2.5,NaN,'10'])assert.throws(()=>simular({valorCentavos:10000,forma:'credito_parcelado',parcelas}));
  assert.throws(()=>simular({valorCentavos:10000,forma:'credito_avista',parcelas:2}));
  for(const valorCentavos of [null,NaN,99,100.1,100000001,Number.MAX_SAFE_INTEGER])assert.throws(()=>simular({valorCentavos,forma:'credito_avista'}));
});
