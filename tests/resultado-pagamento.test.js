import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
const validar=runInNewContext(await readFile(new URL('../valores.js',import.meta.url),'utf8')+'\nvalidarResultadoPreparacao');
const pedido={id:'44444444-4444-4444-8444-444444444444',atualizado_em:'2026-11-19T12:00:00.123456Z',valor_centavos:10005};
const condicoes={forma:'credito_parcelado',parcelas:10};
const resposta={solicitacaoId:pedido.id,versaoOrcamento:pedido.atualizado_em,
  valorServicoCentavos:10005,profissionalCentavos:9004,comissaoCentavos:1001,
  ...condicoes,preparacaoId:'55555555-5555-4555-8555-555555555555',preparacaoRegistrada:true,pagamentoHabilitado:false};
test('resultado de teste conserva a divisão por centavos e as condições selecionadas',()=>{
  assert.equal(validar(resposta,pedido,condicoes),resposta);
});
test('resposta de cobrança, sem persistência, com valores incoerentes ou referência inválida é recusada',()=>{
  for(const alteracao of [{pagamentoHabilitado:true},{pagamentoHabilitado:undefined},{preparacaoRegistrada:false},
    {valorServicoCentavos:10000},{comissaoCentavos:1000},{profissionalCentavos:9005},
    {preparacaoId:'<img src=x>'},{forma:'credito_avista'},{parcelas:9}]) {
    assert.throws(()=>validar({...resposta,...alteracao},pedido,condicoes));
  }
});
test('resposta de outro pedido ou de versão anterior não é exibida como preparação atual',()=>{
  for(const alteracao of [{solicitacaoId:'66666666-6666-4666-8666-666666666666'},
    {versaoOrcamento:'2026-11-19T12:00:00.123455Z'}]) {
    assert.throws(()=>validar({...resposta,...alteracao},pedido,condicoes));
  }
});
