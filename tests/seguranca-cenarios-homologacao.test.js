import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const casos = [
  'testar-fluxo-contratacao-idempotencia.sql',
  'testar-preparacao-obsoleta-apos-inicio.sql',
  'testar-preparacao-apos-cancelamento.sql',
  'testar-versao-valor-obsoletos.sql',
  'testar-acesso-financeiro-autenticado.sql',
  'testar-insercao-financeira-anonima.sql',
  'testar-immutabilidade-financeira-servico.sql',
];

for (const nome of casos) {
  test(`cenário de homologação ${nome} é reversível e não cobra`, () => {
    const sql = readFileSync(new URL(`../supabase/homologacao/${nome}`, import.meta.url), 'utf8');
    const comandos = sql.replace(/--[^\n]*/g, '').trim();
    assert.match(comandos, /^BEGIN\s*;/i);
    assert.match(comandos, /ROLLBACK\s*;\s*$/i);
    assert.doesNotMatch(comandos, /\bCOMMIT\s*;/i);
    const semExclusaoInerte = comandos.replace(/DELETE\s+FROM\s+private\.tentativas_pagamento_teste\s+WHERE\s+false\s*;/gi, '');
    assert.doesNotMatch(semExclusaoInerte, /\b(?:DELETE|TRUNCATE|DROP)\s+/i);
    // A auditoria de privilégios usa UPDATE ... WHERE false para exigir erro de permissão,
    // sem afetar linhas; essa instrução inerte não representa ativação de pagamento.
    const semAtualizacoesInertes = comandos.replace(/UPDATE\s+private\.preparacoes_pagamento\s+SET\s+pagamento_habilitado\s*=\s*true\s+WHERE\s+false\s*;/gi, '');
    assert.doesNotMatch(semAtualizacoesInertes, /\b(?:pagamento_habilitado|repasse_habilitado)\s*=\s*true\b/i);
  });
}
