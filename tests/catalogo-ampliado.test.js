import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const lista = html.match(/<datalist id="sugestoes-profissoes">[\s\S]*?<\/datalist>/)[0];
const profissoes = Array.from(lista.matchAll(/value="([^"]+)"/g), m => m[1]);
test('catálogo ampliado mantém pelo menos 231 profissões distintas', () => {
  assert.ok(profissoes.length >= 231);
  assert.equal(new Set(profissoes.map(p => p.normalize('NFC').toLocaleLowerCase('pt-BR'))).size, profissoes.length);
});
test('atalhos apontam para profissões existentes', () => {
  const atalhos = Array.from(html.matchAll(/data-servico-popular="([^"]+)"/g), m => m[1]);
  assert.ok(atalhos.length >= 60);
  for (const atalho of atalhos) assert.ok(profissoes.includes(atalho), atalho);
});
test('categorias e busca livre permanecem disponíveis', () => {
  const categorias = html.match(/<details id="categorias-busca">[\s\S]*?<\/form>/)[0];
  assert.ok((categorias.match(/<summary>/g) || []).length >= 12);
  assert.match(html, /name="servico" list="sugestoes-profissoes"/);
});
