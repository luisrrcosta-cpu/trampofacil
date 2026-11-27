import test from 'node:test';
import assert from 'node:assert/strict';
import {prepararRascunhoContrato,serializarRascunhoContrato} from '../contratos-core.js';
const base=()=>({
  solicitacao_id:'11111111-1111-4111-8111-111111111111',
  cliente_usuario_id:'22222222-2222-4222-8222-222222222222',
  profissional_usuario_id:'33333333-3333-4333-8333-333333333333',
  versao_minuta:'ensaio-v1',
  escopo:'Pintura de parede interna conforme orçamento.',
  materiais_descricao:'Tintas fornecidas pelo cliente, sem cobrança de materiais.',
  mao_obra_centavos:10000,materiais_centavos:0,total_centavos:10000,
  inicio_previsto:'2026-12-01',fim_previsto:'2026-12-03',
  condicoes:'Execução conforme escopo acordado pelas duas partes.',
});
test('rascunho discrimina valores e preserva a entrada sem assinatura implícita',()=>{
  const entrada=base(),copia=structuredClone(entrada),r=prepararRascunhoContrato(entrada);
  assert.deepEqual(entrada,copia);assert.equal(r.total_centavos,10000);
  assert.equal(r.formato,'trampofacil.contrato-rascunho.v1');assert.ok(Object.isFrozen(r));
  assert.equal('assinado' in r,false);assert.equal('pago' in r,false);
  const somenteMateriais={...base(),mao_obra_centavos:0,materiais_centavos:10000};
  assert.equal(prepararRascunhoContrato(somenteMateriais).mao_obra_centavos,0);
});
test('rascunho rejeita valores fracionários, negativos, excessivos e totais divergentes',()=>{
  for(const valor of [-1,1.5,'10000',NaN,Infinity,100000001])assert.throws(()=>prepararRascunhoContrato({...base(),mao_obra_centavos:valor}));
  assert.throws(()=>prepararRascunhoContrato({...base(),materiais_centavos:1}));
  assert.throws(()=>prepararRascunhoContrato({...base(),mao_obra_centavos:99,total_centavos:99}));
});
test('rascunho exige datas reais e cronologia sem inventar prazo',()=>{
  for(const data of ['2026-02-29','2026-04-31','2026-13-01','2026-00-01','01/12/2026',''])assert.throws(()=>prepararRascunhoContrato({...base(),inicio_previsto:data}));
  assert.throws(()=>prepararRascunhoContrato({...base(),fim_previsto:'2026-11-30'}));
  assert.equal(prepararRascunhoContrato({...base(),inicio_previsto:'2028-02-29',fim_previsto:'2028-02-29'}).fim_previsto,'2028-02-29');
});
test('rascunho rejeita dados incompletos, partes iguais e afirmações financeiras adicionais',()=>{
  for(const valor of [null,[],{}, {...base(),cliente_usuario_id:base().profissional_usuario_id},{...base(),solicitacao_id:'invalido'},{...base(),pago:true},{...base(),versao_minuta:'../../texto'},{...base(),escopo:'curto'},{...base(),condicoes:'\u0000texto invalido'}])assert.throws(()=>prepararRascunhoContrato(valor));
  const faltando=base();delete faltando.materiais_descricao;assert.throws(()=>prepararRascunhoContrato(faltando));
});
test('serialização independe da ordem de entrada e normaliza Unicode e quebras de linha',()=>{
  const a={...base(),escopo:'  Pintura de cafe\u0301\r\ncom duas demãos.  '};
  const b=Object.fromEntries(Object.entries({...a,escopo:'Pintura de café\ncom duas demãos.'}).reverse());
  assert.equal(serializarRascunhoContrato(a),serializarRascunhoContrato(b));
  assert.notEqual(serializarRascunhoContrato(a),serializarRascunhoContrato({...a,condicoes:'Outra condição combinada pelas partes.'}));
});
