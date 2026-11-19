import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test, { before, after, beforeEach, afterEach } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const cliente = '11111111-1111-4111-8111-111111111111';
const profissional = '22222222-2222-4222-8222-222222222222';
const terceiro = '33333333-3333-4333-8333-333333333333';
const pedido = '44444444-4444-4444-8444-444444444444';
const versao = '2026-11-19T10:00:00.123456Z';
let db;

before(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create schema private;
    create table auth.users(id uuid primary key);
    create table public.solicitacoes (
      id uuid primary key, cliente_usuario_id uuid not null,
      profissional_usuario_id uuid not null, status text not null,
      valor_centavos integer, atualizado_em timestamptz not null
    );
    alter table public.solicitacoes enable row level security;
    grant select, update on public.solicitacoes to service_role;
  `);
  const pasta = new URL('../supabase/migrations/', import.meta.url);
  const nome = (await readdir(pasta)).find(n => n.endsWith('_registrar_preparacao_pagamento_teste.sql'));
  await db.exec(await readFile(new URL(nome, pasta), 'utf8'));
  const bloqueio = (await readdir(pasta)).find(n => n.endsWith('_negar_acesso_publico_preparacoes.sql'));
  await db.exec(await readFile(new URL(bloqueio, pasta), 'utf8'));
});
after(async () => db?.close());
beforeEach(async () => {
  await db.exec(`begin;
    insert into auth.users values ('${cliente}'), ('${profissional}'), ('${terceiro}');
    insert into public.solicitacoes values
      ('${pedido}', '${cliente}', '${profissional}', 'aceita', 10005, '${versao}');
    set local role service_role;
  `);
});
afterEach(async () => db.exec('reset role; rollback'));

const sqlRegistro = `select * from private.registrar_preparacao_pagamento($1::uuid,$2::uuid,$3::timestamptz,$4::text,$5::integer)`;
const registrar = (opcoes={}) => db.query(sqlRegistro, [opcoes.pedido ?? pedido,
  opcoes.cliente ?? cliente, opcoes.versao ?? versao,
  opcoes.forma ?? 'credito_parcelado', opcoes.parcelas ?? 10]);
async function rejeitar(acao, codigo) {
  await db.exec('savepoint falha_esperada');
  await assert.rejects(acao(), erro => erro.code === codigo);
  await db.exec('rollback to savepoint falha_esperada; release savepoint falha_esperada');
}

test('preparação repetida retorna o mesmo registro e preserva os centavos sem cobrar', async () => {
  const a = (await registrar()).rows[0];
  const b = (await registrar()).rows[0];
  assert.equal(a.id, b.id);
  assert.equal(a.valor_servico_centavos, 10005);
  assert.equal(a.comissao_centavos, 1001);
  assert.equal(a.profissional_centavos, 9004);
  assert.equal(a.pagamento_habilitado, false);
  assert.equal(a.estado, 'preparada');
  assert.equal((await db.query('select count(*)::int as n from private.preparacoes_pagamento')).rows[0].n, 1);
  assert.equal((await db.query('select status from public.solicitacoes')).rows[0].status, 'aceita');
});

test('repetição com outras condições ou versão desatualizada é recusada', async () => {
  await registrar();
  await rejeitar(() => registrar({ parcelas: 9 }), '22023');
  await rejeitar(() => registrar({ forma: 'credito_avista', parcelas: 1 }), '22023');
  await rejeitar(() => registrar({ versao: '2026-11-19T10:00:00.123455Z' }), '22023');
  assert.equal((await db.query('select count(*)::int as n from private.preparacoes_pagamento')).rows[0].n, 1);
});

test('identidade de outro cliente e pedido inexistente recebem o mesmo bloqueio', async () => {
  await rejeitar(() => registrar({ cliente: terceiro }), 'P0002');
  await rejeitar(() => registrar({ cliente: profissional }), 'P0002');
  await rejeitar(() => registrar({ pedido: terceiro }), 'P0002');
});

test('contratação não aceita, cancelada ou com forma inválida não é registrada', async () => {
  for (const status of ['solicitada', 'proposta', 'em_andamento', 'entregue', 'concluida', 'cancelada']) {
    await db.query('update public.solicitacoes set status=$1', [status]);
    await rejeitar(() => registrar(), '22023');
  }
  for (const opcoes of [{ forma: 'pix' }, { parcelas: 11 }, { parcelas: 1 }]) {
    await rejeitar(() => registrar(opcoes), '22023');
  }
  assert.equal((await db.query('select count(*)::int as n from private.preparacoes_pagamento')).rows[0].n, 0);
});

test('anon e authenticated não leem, gravam nem executam o registro privado', async () => {
  for (const papel of ['anon', 'authenticated']) {
    await db.exec('set local role ' + papel);
    await rejeitar(() => db.query('select * from private.preparacoes_pagamento'), '42501');
    await rejeitar(() => registrar(), '42501');
  }
  await db.exec('reset role');
  const acl = (await db.query(`select
    has_function_privilege('authenticated', 'private.registrar_preparacao_pagamento(uuid,uuid,timestamptz,text,integer)', 'execute') as usuario,
    has_function_privilege('anon', 'private.registrar_preparacao_pagamento(uuid,uuid,timestamptz,text,integer)', 'execute') as anon,
    relrowsecurity as rls from pg_class where oid='private.preparacoes_pagamento'::regclass`)).rows[0];
  assert.equal(acl.usuario, false); assert.equal(acl.anon, false); assert.equal(acl.rls, true);
});

test('unicidade e permissões impedem segundo registro, alteração e exclusão pelo papel de serviço', async () => {
  await registrar();
  await rejeitar(() => db.query(`insert into private.preparacoes_pagamento
    (solicitacao_id,cliente_usuario_id,profissional_usuario_id,versao_orcamento,
      valor_servico_centavos,comissao_centavos,profissional_centavos,forma,parcelas)
    select solicitacao_id,cliente_usuario_id,profissional_usuario_id,versao_orcamento,
      valor_servico_centavos,comissao_centavos,profissional_centavos,forma,parcelas
    from private.preparacoes_pagamento`), '23505');
  await rejeitar(() => db.query("update private.preparacoes_pagamento set pagamento_habilitado=true"), '42501');
  await rejeitar(() => db.query(`insert into private.preparacoes_pagamento
    (solicitacao_id,cliente_usuario_id,profissional_usuario_id,versao_orcamento,
      valor_servico_centavos,comissao_centavos,profissional_centavos,forma,parcelas,pagamento_habilitado)
    select solicitacao_id,cliente_usuario_id,profissional_usuario_id,versao_orcamento + interval '1 second',
      valor_servico_centavos,comissao_centavos,profissional_centavos,forma,parcelas,true
    from private.preparacoes_pagamento`), '23514');
  await rejeitar(() => db.query('delete from private.preparacoes_pagamento'), '42501');
});
