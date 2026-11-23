import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {PGlite} from '@electric-sql/pglite';

test('cadastro inclusivo mantém legado e RLS, valida tipos e impede acesso alheio', async t => {
  const db = new PGlite(); t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated;
    create table public.profissionais (id int primary key, usuario_id text, publicado boolean default false);
    insert into public.profissionais (id,usuario_id) values (1,'dono'),(2,'outro');
    alter table public.profissionais enable row level security;
    grant select on public.profissionais to authenticated;
    grant insert(id,usuario_id), update(usuario_id) on public.profissionais to authenticated;
    create policy dono on public.profissionais to authenticated
      using (usuario_id = current_setting('app.usuario',true))
      with check (usuario_id = current_setting('app.usuario',true));
    create policy autenticacao on public.profissionais as restrictive to authenticated
      using (current_setting('app.anonimo',true) = 'false')
      with check (current_setting('app.anonimo',true) = 'false');
  `);
  await db.exec(await readFile(new URL('../supabase/homologacao/cadastro_inclusivo_prestadores.sql',import.meta.url),'utf8'));
  assert.equal((await db.query('select count(*)::int as n from profissionais where tipo_prestador is null')).rows[0].n,2);
  await db.exec("set role authenticated; set app.usuario='dono'; set app.anonimo='false'");
  for (const tipo of ['pessoa_fisica','mei','empresa']) for (const atividade of ['regular','ocasional']) {
    await db.query('update profissionais set tipo_prestador=$1,tipo_atividade=$2 where id=1',[tipo,atividade]);
    assert.deepEqual((await db.query('select tipo_prestador,tipo_atividade from profissionais')).rows,[{tipo_prestador:tipo,tipo_atividade:atividade}]);
  }
  for (const [coluna,valor] of [['tipo_prestador','admin'],['tipo_atividade','informal']]) {
    await assert.rejects(db.query('update profissionais set '+coluna+'=$1 where id=1',[valor]),/check constraint/);
  }
  assert.equal((await db.query("update profissionais set tipo_prestador='mei' where id=2 returning id")).rows.length,0);
  await assert.rejects(db.exec("insert into profissionais(id,usuario_id,tipo_prestador,tipo_atividade) values(3,'outro','mei','regular')"),/row-level security/);
  await assert.rejects(db.exec('update profissionais set publicado=true where id=1'),/permission denied/);
  await db.exec("set app.anonimo='true'");
  assert.equal((await db.query('select * from profissionais')).rows.length,0);
  await db.exec('reset role; set role anon');
  await assert.rejects(db.exec('select tipo_prestador from profissionais'),/permission denied/);
});
