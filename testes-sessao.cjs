'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const contexto = vm.createContext({});
vm.runInContext(fs.readFileSync('sessao.js', 'utf8'), contexto, { filename: 'sessao.js' });
const criar = vm.runInContext('criarControleSessao', contexto);
async function testar() {
  const controle = criar();
  await assert.rejects(() => controle.requisitar(async () => ({ ok: true })), /Entre na sua conta/);
  controle.alterar({ token: 'token-teste', usuario: 'usuario-a' });
  const ok = await controle.requisitar(async (token) => {
    assert.equal(token, 'token-teste');
    return { ok: true, status: 200, json: async () => ({ sucesso: true }) };
  });
  assert.equal((await ok.json()).sucesso, true);
  let liberar;
  const pendente = controle.requisitar(async () => new Promise(resolve => { liberar = resolve; }));
  controle.alterar({ token: 'token-b', usuario: 'usuario-b' });
  liberar({ ok: true, status: 200, json: async () => ({}) });
  await assert.rejects(pendente, /sessão mudou/);
  const anterior = await controle.requisitar(async () => ({ ok: true, status: 200, json: async () => ({ segredo: true }) }));
  controle.alterar(undefined);
  await assert.rejects(() => anterior.json(), /sessão mudou/);
  console.log('Testes de sessao aprovados: login, troca de conta e invalidacao.');
}
testar().catch(erro => { console.error(erro); process.exitCode = 1; });
