import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const html = await readFile(new URL('../index.html', import.meta.url),'utf8');
const politica = /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/.exec(html)?.[1];
const diretivas = new Map((politica || '').split(';').map(d => d.trim().split(/\s+/)).map(([nome,...valores]) => [nome,valores]));
test('interface limita conexões ao projeto de homologação e impede formulários externos', () => {
  assert.deepEqual(diretivas.get('connect-src'), ['https://asdszqtpydiowgerxwee.supabase.co']);
  for (const chave of ['default-src','base-uri','object-src','form-action','frame-src']) {
    assert.deepEqual(diretivas.get(chave), ["'none'"]);
  }
  assert.deepEqual(diretivas.get('script-src'), ["'self'"]);
  assert.ok(html.indexOf('Content-Security-Policy') < html.indexOf('<style>'));
  assert.ok(html.indexOf('Content-Security-Policy') < html.indexOf('<script'));
});
test('CSS autorizado por hash corresponde ao conteúdo exato sem liberar estilos arbitrários', () => {
  const css = /<style>([\s\S]*?)<\/style>/.exec(html)[1];
  const hash = createHash('sha256').update(css).digest('base64');
  assert.deepEqual(diretivas.get('style-src'), ["'sha256-" + hash + "'"]);
  assert.doesNotMatch(politica, /unsafe-inline|unsafe-eval|\*/);
});
