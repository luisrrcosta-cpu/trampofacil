'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { podeMudarContratacao, papelNaContratacao } = vm.runInNewContext(fs.readFileSync('transicoes-contratacao.js', 'utf8') + '\n({podeMudarContratacao, papelNaContratacao})');
const permitidas = [
  ['solicitada','proposta','profissional'],
  ['proposta','proposta','profissional'],
  ['proposta','aceita','cliente'],
  ['aceita','em_andamento','profissional'],
  ['em_andamento','entregue','profissional'],
  ['entregue','concluida','cliente'],
  ['solicitada','cancelada','cliente'],
  ['solicitada','cancelada','profissional'],
  ['proposta','cancelada','cliente'],
  ['proposta','cancelada','profissional'],
  ['aceita','cancelada','cliente'],
  ['aceita','cancelada','profissional'],
];
for (const [de, para, papel] of permitidas) assert.equal(podeMudarContratacao(de, para, papel), true, `${de} -> ${para} ${papel}`);
const estados = ['solicitada','proposta','aceita','em_andamento','entregue','concluida','cancelada'];
for (const de of estados) for (const para of estados) for (const papel of ['cliente','profissional']) {
  const esperado = permitidas.some(p => p[0] === de && p[1] === para && p[2] === papel);
  assert.equal(podeMudarContratacao(de, para, papel), esperado, `${de} -> ${para} ${papel}`);
}
assert.equal(podeMudarContratacao('inexistente','aceita','cliente'), false);
assert.equal(podeMudarContratacao('proposta','aceita','visitante'), false);
console.log('Testes de transicoes de contratacao aprovados.');

const pedido = {cliente_usuario_id:'cliente', profissional_usuario_id:'profissional'};
assert.equal(papelNaContratacao(pedido,'cliente'),'cliente');
assert.equal(papelNaContratacao(pedido,'profissional'),'profissional');
for (const usuario of ['terceiro','',undefined,null]) {
  const papel = papelNaContratacao(pedido,usuario);
  assert.equal(papel,undefined);
  for (const de of estados) for (const para of estados) assert.equal(podeMudarContratacao(de,para,papel),false);
}
assert.equal(papelNaContratacao(null,'cliente'),undefined);
assert.equal(papelNaContratacao({cliente_usuario_id:'cliente',profissional_usuario_id:'cliente'},'cliente'),undefined);
console.log('Ações de terceiros e identidade ambígua bloqueadas na interface.');
