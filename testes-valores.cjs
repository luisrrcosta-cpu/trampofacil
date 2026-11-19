'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const contexto = vm.createContext({});
vm.runInContext(fs.readFileSync('valores.js', 'utf8'), contexto, { filename: 'valores.js' });
const converter = vm.runInContext('propostaEmCentavos', contexto);
for (const [entrada, esperado] of [
  ['1',100], ['1,50',150], ['1.5',150], ['10,05',1005],
  ['200',20000], ['1000000,00',100000000], ['0,99',99],
]) {
  if (entrada === '0,99') assert.throws(() => converter(entrada), /entre R\$ 1/);
  else assert.equal(converter(entrada), esperado);
}
for (const invalido of ['0', '-10', '1,999', '1.000,00', '1000000,01', 'abc', 'Infinity', '1e5', '']) {
  assert.throws(() => converter(invalido), /Informe|orçamento/, `Valor invalido aceito: ${invalido}`);
}
console.log('Testes de valores monetarios aprovados.');
