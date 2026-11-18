import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const cliente = '00000000-0000-0000-0000-000000000001';
const profissional = '00000000-0000-0000-0000-000000000002';
const terceiro = '00000000-0000-0000-0000-000000000003';
const perfil = '00000000-0000-0000-0000-000000000004';
const oculto = '00000000-0000-0000-0000-000000000005';
const pedido = '00000000-0000-0000-0000-000000000006';

test('catálogo e solicitações respeitam o acesso e as transições existentes', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create schema private;
    grant usage on schema auth to public;
    create function auth.jwt() returns jsonb language sql stable as
      $$ select current_setting('request.jwt.claims', true)::jsonb $$;
    create function auth.uid() returns uuid language sql stable as
      $$ select (auth.jwt()->>'sub')::uuid $$;

    create table clientes (usuario_id uuid primary key);
    create table profissionais (id uuid primary key, usuario_id uuid, publicado boolean);
    create table catalogo_profissionais (
      id uuid primary key, nome text, cidade text, servico text, descricao text, ativo boolean
    );
    create table solicitacoes (
      id uuid primary key, cliente_usuario_id uuid not null, profissional_id uuid not null,
      profissional_usuario_id uuid not null, titulo text not null, descricao text not null,
      status text not null, valor_centavos integer check (valor_centavos between 100 and 100000000),
      criado_em timestamptz not null, atualizado_em timestamptz not null
    );
    create table historico_solicitacoes (
      solicitacao_id uuid, ator_usuario_id uuid, status text, valor_centavos integer
    );

    alter table catalogo_profissionais enable row level security;
    alter table solicitacoes enable row level security;
    grant select on catalogo_profissionais to anon, authenticated;
    grant select on solicitacoes to authenticated;
    grant insert (cliente_usuario_id, profissional_id, titulo, descricao),
      update (status, valor_centavos) on solicitacoes to authenticated;
    create policy catalogo_leitura on catalogo_profissionais for select to anon, authenticated using (ativo);
    create policy solicitacoes_leitura on solicitacoes for select to authenticated
      using ((select auth.uid()) in (cliente_usuario_id, profissional_usuario_id));
    create policy solicitacoes_criacao on solicitacoes for insert to authenticated
      with check ((select auth.uid()) = cliente_usuario_id);
    create policy solicitacoes_edicao on solicitacoes for update to authenticated
      using ((select auth.uid()) in (cliente_usuario_id, profissional_usuario_id))
      with check ((select auth.uid()) in (cliente_usuario_id, profissional_usuario_id));

    insert into clientes values ('${cliente}'), ('${profissional}');
    insert into profissionais values ('${perfil}', '${profissional}', true), ('${oculto}', '${terceiro}', false);
    insert into catalogo_profissionais values
      ('${perfil}', 'Pessoa de teste', 'São Paulo', 'Pintura 100%', null, true),
      ('${oculto}', 'Oculto', 'São Paulo', 'Pintura', null, false);
  `);
  await db.exec(await readFile(new URL('./triggers.sql', import.meta.url), 'utf8'));
  await db.exec(`
    create trigger validar_solicitacao before insert or update on solicitacoes
      for each row execute function private.validar_solicitacao();
    create trigger registrar_solicitacao after insert or update on solicitacoes
      for each row execute function private.registrar_solicitacao();
  `);
  const migrations = new URL('../supabase/migrations/', import.meta.url);
  const migration = (await readdir(migrations)).find((file) => file.endsWith('_conectar_catalogo_e_solicitacoes.sql'));
  await db.exec(await readFile(new URL(migration, migrations), 'utf8'));

  await db.exec('set role anon');
  const busca = await db.query("select * from buscar_profissionais('100%', 'SÃO')");
  assert.deepEqual(busca.rows.map((row) => row.id), [perfil]);
  assert.deepEqual(Object.keys(busca.rows[0]), ['id', 'nome', 'cidade', 'servico', 'descricao']);
  assert.deepEqual((await db.query("select * from buscar_profissionais('100_', '')")).rows, []);
  assert.deepEqual((await db.query("select * from buscar_profissionais('', '', 1)")).rows, []);
  await assert.rejects(db.query('select * from solicitacoes'), /permission denied/);

  const autenticar = (sub, is_anonymous = false) => db.exec(
    `set role authenticated; set request.jwt.claims = '${JSON.stringify({ sub, is_anonymous })}'`,
  );
  const criar = (ator, alvo) => db.query(
    'insert into solicitacoes (id,cliente_usuario_id,profissional_id,titulo,descricao) values ($1,$2,$3,$4,$5) returning status,profissional_usuario_id',
    [pedido, ator, alvo, 'Pintura', 'Pintar uma parede'],
  );
  await autenticar(cliente, true);
  await assert.rejects(criar(cliente, perfil), /row-level security/);
  await autenticar(cliente);
  await assert.rejects(criar(cliente, oculto), /indisponível/);
  await assert.rejects(criar(terceiro, perfil), /cadastro de cliente/);
  assert.deepEqual((await criar(cliente, perfil)).rows, [{ status: 'solicitada', profissional_usuario_id: profissional }]);
  await assert.rejects(criar(cliente, perfil), /duplicate key/);
  await assert.rejects(db.exec("update solicitacoes set titulo = 'Alterado'"), /permission denied/);
  await assert.rejects(db.exec("update solicitacoes set status = 'aceita'"), /não permitida/);
  await autenticar(terceiro);
  assert.deepEqual((await db.query('select id from solicitacoes')).rows, []);
  assert.equal((await db.query("update solicitacoes set status = 'cancelada'")).affectedRows, 0);
  await autenticar(profissional);
  await db.exec("update solicitacoes set status = 'proposta', valor_centavos = 15000");
  await autenticar(cliente);
  await assert.rejects(db.exec("update solicitacoes set status = 'aceita', valor_centavos = 1"), /não permitida/);
  await db.exec("update solicitacoes set status = 'aceita'");
  await autenticar(profissional);
  await db.exec("update solicitacoes set status = 'em_andamento'; update solicitacoes set status = 'entregue'");
  await autenticar(cliente);
  await db.exec("update solicitacoes set status = 'concluida'; reset role");
  const historico = await db.query('select status from historico_solicitacoes');
  assert.deepEqual(historico.rows.map(({ status }) => status),
    ['solicitada', 'proposta', 'aceita', 'em_andamento', 'entregue', 'concluida']);
});
