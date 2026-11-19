'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const contexto = vm.createContext({});
for (const arquivo of ['valores.js', 'simulacao.js']) {
  vm.runInContext(fs.readFileSync(arquivo, 'utf8'), contexto, { filename: arquivo });
}
const converter = vm.runInContext('propostaEmCentavos', contexto);
const simular = vm.runInContext('simularPagamento', contexto);
assert.equal(converter('100,00'), 10000);
assert.equal(converter('1'), 100);
assert.equal(converter('12.5'), 1250);
for (const valor of ['0,99', '1,001', '1.000,00', '-1', '1000000,01', '']) {
  assert.throws(() => converter(valor), undefined, valor);
}
for (const [forma, parcelas, pontos] of [
  ['credito_avista', 1, 400],
  ['credito_parcelado', 2, 1200],
  ['credito_parcelado', 10, 1200],
]) {
  for (const base of [100, 101, 999, 10000, 999999, 100000000]) {
    const resultado = simular({ valorCentavos: base, forma, parcelas });
    assert.equal(resultado.somenteSimulacao, true);
    assert.equal(resultado.taxasOnlineConfirmadas, false);
    assert.equal(resultado.impostosCalculados, false);
    assert.equal(resultado.comissaoCentavos + resultado.profissionalCentavos, base);
    assert.equal(resultado.comissaoCentavos, Math.round(base / 10));
    assert.equal(resultado.parcelasCentavos.length, parcelas);
    assert.equal(resultado.parcelasCentavos.reduce((s, x) => s + x, 0), resultado.totalCentavos);
    assert.equal(resultado.tarifaEstimadaCentavos + resultado.ajusteArredondamentoCentavos + base, resultado.totalCentavos);
    assert.equal(resultado.taxaPontosBase, pontos);
    assert.ok(resultado.totalCentavos >= base);
  }
}
for (const dados of [
  { valorCentavos: 99, forma: 'credito_avista' },
  { valorCentavos: 10000, forma: 'pix' },
  { valorCentavos: 10000, forma: 'credito_parcelado', parcelas: 11 },
  { valorCentavos: 10000, forma: 'credito_avista', parcelas: 2 },
]) assert.throws(() => simular(dados));
console.log('Testes financeiros aprovados: valores, 10/90, tarifas e parcelas.');
