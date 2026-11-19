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

test('catálogo, solicitações e conversas respeitam acesso, autoria e transições', async (t) => {
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

    create table mensagens_solicitacoes (
      id uuid primary key default gen_random_uuid(),
      solicitacao_id uuid not null references solicitacoes(id),
      autor_usuario_id uuid not null default auth.uid(),
      texto text not null check (length(trim(texto)) between 1 and 2000),
      criado_em timestamptz not null default now()
    );
    alter table historico_solicitacoes enable row level security;
    alter table mensagens_solicitacoes enable row level security;
    grant select on historico_solicitacoes, mensagens_solicitacoes to authenticated;
    grant insert (solicitacao_id, texto) on mensagens_solicitacoes to authenticated;
    create policy historico_leitura on historico_solicitacoes for select to authenticated
      using (exists (select 1 from solicitacoes s where s.id = solicitacao_id
        and (select auth.uid()) in (s.cliente_usuario_id, s.profissional_usuario_id)));
    create policy mensagens_leitura on mensagens_solicitacoes for select to authenticated
      using (exists (select 1 from solicitacoes s where s.id = solicitacao_id
        and (select auth.uid()) in (s.cliente_usuario_id, s.profissional_usuario_id)));
    create policy mensagens_envio on mensagens_solicitacoes for insert to authenticated
      with check (autor_usuario_id = (select auth.uid())
        and exists (select 1 from solicitacoes s where s.id = solicitacao_id
          and (select auth.uid()) in (s.cliente_usuario_id, s.profissional_usuario_id)
          and s.status not in ('concluida', 'cancelada')));

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
  const falar = (texto, alvo = pedido) => db.query(
    'insert into mensagens_solicitacoes (solicitacao_id,texto) values ($1,$2) returning autor_usuario_id',
    [alvo, texto],
  );
  const criar = (ator, alvo, id = pedido) => db.query(
    'insert into solicitacoes (id,cliente_usuario_id,profissional_id,titulo,descricao) values ($1,$2,$3,$4,$5) returning status,profissional_usuario_id',
    [id, ator, alvo, 'Pintura', 'Pintar uma parede'],
  );
  await autenticar(cliente, true);
  await assert.rejects(criar(cliente, perfil), /row-level security/);
  await autenticar(cliente);
  await assert.rejects(criar(cliente, oculto), /indisponível/);
  await assert.rejects(criar(terceiro, perfil), /cadastro de cliente/);
  assert.deepEqual((await criar(cliente, perfil)).rows, [{ status: 'solicitada', profissional_usuario_id: profissional }]);
  await assert.rejects(criar(cliente, perfil), /duplicate key/);
  await assert.rejects(falar('   '), /check constraint/);
  assert.deepEqual((await falar('Mensagem fictícia do cliente')).rows, [{ autor_usuario_id: cliente }]);
  await assert.rejects(db.query(
    'insert into mensagens_solicitacoes (solicitacao_id,texto,autor_usuario_id) values ($1,$2,$3)',
    [pedido, 'Tentativa fictícia', profissional],
  ), /permission denied/);
  assert.equal((await db.query('select * from historico_solicitacoes')).rows.length, 1);
  await assert.rejects(db.exec("update historico_solicitacoes set status = 'cancelada'"), /permission denied/);
  await assert.rejects(db.exec("update mensagens_solicitacoes set texto = 'Alterado'"), /permission denied/);
  await assert.rejects(db.exec("update solicitacoes set titulo = 'Alterado'"), /permission denied/);
  await assert.rejects(db.exec("update solicitacoes set status = 'aceita'"), /não permitida/);
  await autenticar(terceiro);
  assert.deepEqual((await db.query('select id from solicitacoes')).rows, []);
  assert.deepEqual((await db.query('select * from historico_solicitacoes')).rows, []);
  assert.deepEqual((await db.query('select * from mensagens_solicitacoes')).rows, []);
  await assert.rejects(falar('Mensagem de terceiro'), /row-level security/);
  await autenticar(cliente, true);
  assert.deepEqual((await db.query('select * from mensagens_solicitacoes')).rows, []);
  await assert.rejects(falar('Mensagem de sessão anônima'), /row-level security/);
  await autenticar(terceiro);
  assert.equal((await db.query("update solicitacoes set status = 'cancelada'")).affectedRows, 0);
  await autenticar(profissional);
  assert.deepEqual((await falar('Resposta fictícia do profissional')).rows, [{ autor_usuario_id: profissional }]);
  await db.exec("update solicitacoes set status = 'proposta', valor_centavos = 15000");
  await autenticar(cliente);
  await assert.rejects(db.exec("update solicitacoes set status = 'aceita', valor_centavos = 1"), /não permitida/);
  await db.exec("update solicitacoes set status = 'aceita'");
  await autenticar(profissional);
  await db.exec("update solicitacoes set status = 'em_andamento'");
  await assert.rejects(db.exec("update solicitacoes set status = 'cancelada'"), /não permitida/);
  await autenticar(cliente);
  await assert.rejects(db.exec("update solicitacoes set status = 'cancelada'"), /não permitida/);
  await autenticar(profissional);
  await db.exec("update solicitacoes set status = 'entregue'");
  await autenticar(cliente);
  await db.exec("update solicitacoes set status = 'concluida'");
  await assert.rejects(falar('Mensagem após conclusão'), /row-level security/);
  assert.equal((await db.query('select * from mensagens_solicitacoes')).rows.length, 2);
  const historico = await db.query('select status from historico_solicitacoes');
  assert.deepEqual(historico.rows.map(({ status }) => status),
    ['solicitada', 'proposta', 'aceita', 'em_andamento', 'entregue', 'concluida']);

  const cancelado = '00000000-0000-0000-0000-000000000007';
  await criar(cliente, perfil, cancelado);
  await autenticar(profissional);
  await db.query("update solicitacoes set status = 'cancelada' where id = $1", [cancelado]);
  await assert.rejects(falar('Mensagem após cancelamento', cancelado), /row-level security/);
  assert.deepEqual((await db.query('select status from historico_solicitacoes where solicitacao_id=$1', [cancelado])).rows,
    [{ status: 'solicitada' }, { status: 'cancelada' }]);
  await autenticar(cliente);
  assert.deepEqual((await db.query('select status from solicitacoes where id=$1', [cancelado])).rows,
    [{ status: 'cancelada' }]);
});
