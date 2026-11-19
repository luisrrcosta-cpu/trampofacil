import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const codigo = await readFile(new URL('../ambiente.js', import.meta.url), 'utf8');
const validar = runInNewContext(codigo + '\nvalidarAmbiente');
const base = { ambiente: 'homologacao', url: 'https://asdszqtpydiowgerxwee.supabase.co', chavePublicavel: 'sb_publishable_teste' };

test('configuração recusa produção, destinos externos e credenciais administrativas', () => {
  for (const config of [null, {}, { ...base, ambiente: 'producao' },
    { ...base, url: 'https://flropneedvaimzcmvcza.supabase.co' },
    { ...base, url: base.url + '.exemplo.invalid' }, { ...base, url: base.url + '/' },
    { ...base, url: base.url.replace('https:', 'http:') },
    { ...base, chavePublicavel: 'sb_secret_invalida' },
    { ...base, chavePublicavel: 'eyJhbGciOiJIUzI1NiJ9' }]) {
    assert.equal(validar(config).integrado, false);
    assert.equal(validar(config).autenticacaoPronta, false);
  }
});

test('conexão de consulta não libera login sem confirmação explícita', () => {
  assert.equal(validar(base).integrado, true);
  for (const flag of [undefined, false, 'true', 1]) {
    assert.equal(validar({ ...base, autenticacaoPronta: flag }).autenticacaoPronta, false);
  }
  assert.equal(validar({ ...base, autenticacaoPronta: true }).autenticacaoPronta, true);
});
