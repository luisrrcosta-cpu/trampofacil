import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const caminho = new URL('../supabase/homologacao/bloquear-orcamento-obsoleto-tentativa.sql', import.meta.url);
const sql = readFileSync(caminho, 'utf8');

test('migração de homologação serializa por preparação sem UPDATE na tabela privada', () => {
  assert.match(sql, /security\s+invoker/i);
  assert.match(sql, /pg_catalog\.pg_advisory_xact_lock\s*\(/i);
  assert.match(sql, /hashtextextended\s*\(\s*p_preparacao_id::text\s*,\s*0\s*\)/i);
  assert.doesNotMatch(sql, /from\s+private\.preparacoes_pagamento\s+where\s+id\s*=\s*p_preparacao_id\s+for\s+update/i);
});

test('migração não expõe a função financeira a visitantes ou clientes', () => {
  assert.match(sql, /revoke\s+all\s+on\s+function\s+private\.registrar_tentativa_inerte\s*\(uuid,uuid\)\s+from\s+public,\s*anon,\s*authenticated/i);
  assert.match(sql, /grant\s+execute\s+on\s+function\s+private\.registrar_tentativa_inerte\s*\(uuid,uuid\)\s+to\s+service_role/i);
});

test('migração não habilita pagamentos ou repasses', () => {
  assert.doesNotMatch(sql, /pagamento_habilitado\s*=\s*true|repasse_habilitado\s*=\s*true/i);
  assert.doesNotMatch(sql, /https?:\/\//i);
});
