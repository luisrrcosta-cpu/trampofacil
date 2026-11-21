'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const fonte = fs.readFileSync('conversa.js', 'utf8');
const inicio = fonte.indexOf('  const chaveTemporal = (valor) => {');
assert.notEqual(inicio, -1, 'Função de chave temporal não encontrada.');
const fim = fonte.indexOf('\n  };', inicio);
assert.notEqual(fim, -1, 'Fim da chave temporal não encontrado.');
const trecho = fonte.slice(inicio, fim + '\n  };'.length);
const chaveTemporal = vm.runInNewContext(`${trecho}\nchaveTemporal`);

const base = chaveTemporal('2026-11-21T10:00:00.123456Z');
assert.equal(base, chaveTemporal('2026-11-21T07:00:00.123456-03:00'));
assert.equal(base, chaveTemporal('2026-11-21T10:00:00.123456+00:00'));
assert.ok(base > chaveTemporal('2026-11-21T10:00:00.123455Z'));
assert.ok(base < chaveTemporal('2026-11-21T10:00:00.123457Z'));
assert.equal(chaveTemporal('2026-11-21T10:00:00Z'),
  chaveTemporal('2026-11-21T10:00:00.000000Z'));
assert.throws(() => chaveTemporal('data-invalida'));
console.log('Precisão e fusos da paginação de conversas verificados.');
