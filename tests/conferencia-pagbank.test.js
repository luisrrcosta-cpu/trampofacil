import test from 'node:test';
import assert from 'node:assert/strict';
import {conferirConsultaPagBank} from '../server/conferencia-pagbank.js';
const tentativa={ambiente:'sandbox',cobrancaId:'CHAR_TESTE-1',valorCentavos:15000};
const consulta={...tentativa,statusProvedor:'PAID',pagoCentavos:15000,devolvidoCentavos:0};
test('conferência separa autorização, análise e espera de pagamento observado',()=>{
  for(const [status,situacao] of Object.entries({WAITING:'aguardando_pagamento',AUTHORIZED:'somente_autorizado',
    IN_ANALYSIS:'em_analise',DECLINED:'recusado',CANCELED:'cancelado'})) {
    const resultado=conferirConsultaPagBank({...consulta,statusProvedor:status,pagoCentavos:0},tentativa);
    assert.equal(resultado.situacao,situacao); assert.equal(resultado.saldoObservadoCentavos,0);
    assert.equal(resultado.liberarRepasse,false);
  }
  const resultado=conferirConsultaPagBank(consulta,tentativa);
  assert.equal(resultado.situacao,'pagamento_observado'); assert.equal(resultado.liberarRepasse,false);
});
test('devolução parcial e total preservam todos os centavos e não liberam repasse',()=>{
  for(const [devolvido,situacao,saldo] of [[1,'devolucao_parcial',14999],[5000,'devolucao_parcial',10000],[15000,'devolucao_total',0]]) {
    const r=conferirConsultaPagBank({...consulta,devolvidoCentavos:devolvido},tentativa);
    assert.equal(r.situacao,situacao); assert.equal(r.saldoObservadoCentavos,saldo); assert.equal(r.liberarRepasse,false);
  }
  assert.equal(conferirConsultaPagBank({...consulta,statusProvedor:'CANCELED',devolvidoCentavos:15000},tentativa).situacao,'devolucao_total');
});
test('outra cobrança, produção e resumos incoerentes ficam para revisão sem saldo presumido',()=>{
  for(const mudanca of [{ambiente:'producao'},{cobrancaId:'CHAR_OUTRA'},{valorCentavos:15001},
    {statusProvedor:'NOVO_ESTADO'},{statusProvedor:'toString',pagoCentavos:0},{pagoCentavos:14999},{pagoCentavos:NaN},
    {devolvidoCentavos:-1},{devolvidoCentavos:15001},{statusProvedor:'AUTHORIZED'},
    {statusProvedor:'CANCELED',devolvidoCentavos:5000}]) {
    assert.deepEqual(conferirConsultaPagBank({...consulta,...mudanca},tentativa),{situacao:'revisao_necessaria',liberarRepasse:false});
  }
  for(const entrada of [null,{}, {...tentativa,ambiente:'producao'}]) {
    assert.equal(conferirConsultaPagBank(consulta,entrada).situacao,'revisao_necessaria');
  }
});
