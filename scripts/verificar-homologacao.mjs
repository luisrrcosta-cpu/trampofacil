import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

// Verificação externa explícita, fora de npm test. Não envia e-mails nem grava linhas.
const contexto = { window: {} };
runInNewContext(await readFile(new URL('../config.js', import.meta.url), 'utf8'), contexto);
const config = contexto.window.TRAMPOFACIL_SUPABASE;
const validar = runInNewContext(await readFile(new URL('../ambiente.js', import.meta.url), 'utf8') + '\nvalidarAmbiente');
assert.equal(validar(config).integrado, true, 'Selecione exclusivamente a homologação permitida.');

async function consultar(caminho, dados) {
  const resposta = await fetch(config.url + caminho, {
    method: dados ? 'POST' : 'GET',
    headers: { apikey: config.chavePublicavel, 'Content-Type': 'application/json' },
    body: dados ? JSON.stringify(dados) : undefined,
    credentials: 'omit', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000),
  });
  return { status: resposta.status, dados: await resposta.json() };
}

const catalogo = await consultar('/rest/v1/rpc/buscar_profissionais', { termo_servico: '', termo_cidade: '', pagina: 0 });
assert.equal(catalogo.status, 200);
assert.ok(Array.isArray(catalogo.dados));
for (const linha of catalogo.dados) {
  assert.deepEqual(Object.keys(linha).sort(), ['cidade', 'descricao', 'id', 'nome', 'servico']);
}
console.log('OK: catálogo acessível somente com campos públicos.');

for (const tabela of ['clientes', 'profissionais', 'solicitacoes', 'mensagens_solicitacoes', 'historico_solicitacoes']) {
  const resposta = await consultar(`/rest/v1/${tabela}?select=id&limit=1`);
  assert.ok([401, 403].includes(resposta.status), `Acesso sem login deve ser negado: ${tabela}.`);
  assert.equal(resposta.dados.code, '42501');
  console.log(`OK: acesso sem login bloqueado em ${tabela}.`);
}

const usuario = await consultar('/auth/v1/user');
assert.equal(usuario.status, 401);
console.log('OK: Auth exige sessão válida. Nenhum e-mail, cadastro ou pagamento foi criado.');
