'use strict';
const assert = require('node:assert/strict');
const { TRANSICOES_PAGAMENTO, validarTransicaoPagamento } = require('./estados-pagamento.js');
for (const [atual, proximos] of Object.entries(TRANSICOES_PAGAMENTO)) {
  for (const proximo of proximos) {
    assert.equal(validarTransicaoPagamento(atual, proximo, 'servidor_verificado'), proximo);
    assert.throws(() => validarTransicaoPagamento(atual, proximo, 'cliente'));
  }
  assert.throws(() => validarTransicaoPagamento(atual, atual, 'servidor_verificado'));
}
assert.throws(() => validarTransicaoPagamento('pago', 'cancelado', 'servidor_verificado'));
assert.throws(() => validarTransicaoPagamento('reembolsado', 'pago', 'servidor_verificado'));
assert.throws(() => validarTransicaoPagamento('desconhecido', 'pago', 'servidor_verificado'));
console.log('Testes de estados financeiros aprovados.');
