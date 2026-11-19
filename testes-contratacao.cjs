'use strict';
const assert = require('node:assert/strict');
const { podeMudarContratacao } = require('./transicoes-contratacao.js');
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
