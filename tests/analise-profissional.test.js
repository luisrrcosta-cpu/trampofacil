import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('análise profissional aceita modalidades, isola titulares e nunca publica perfis',async t=>{
  const db=new PGlite();t.after(()=>db.close());
  const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
  await db.exec(`
    create role anon;create role authenticated;create role service_role;
    create schema auth;grant usage on schema auth to public;
    create function auth.jwt() returns jsonb language sql stable as
      $$ select current_setting('request.jwt.claims',true)::jsonb $$;
    create function auth.uid() returns uuid language sql stable as
      $$ select (auth.jwt()->>'sub')::uuid $$;
    create table profissionais(usuario_id uuid primary key,publicado boolean not null default false,tipo_prestador text,tipo_atividade text);
    alter table profissionais enable row level security;
    grant select on profissionais to authenticated;
    create policy titular on profissionais for select to authenticated using(usuario_id=(select auth.uid()));
  `);
  let n=1;
  for(const tipo of ['pessoa_fisica','mei','empresa'])for(const atividade of ['regular','ocasional']){
    await db.query('insert into profissionais values($1,false,$2,$3)',[id(n++),tipo,atividade]);
  }
  await db.query("insert into profissionais values($1,true,'mei','regular'),($2,false,null,null)",[id(7),id(8)]);
  await db.exec(await readFile(new URL('../supabase/homologacao/solicitar_analise_profissional.sql',import.meta.url),'utf8'));
  const entrar=async(n,anonimo=false)=>{
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:id(n),is_anonymous:anonimo})]);
    await db.exec('set role authenticated');
  };
  for(let n=1;n<=6;n++){
    await entrar(n);
    await db.query('insert into solicitacoes_analise_profissional(usuario_id) values($1)',[id(n)]);
    assert.equal((await db.query('select * from solicitacoes_analise_profissional')).rows.length,1);
    await assert.rejects(db.query('insert into solicitacoes_analise_profissional(usuario_id) values($1)',[id(n)]),/unique constraint/);
  }
  for(const n of [7,8,9]){
    await entrar(n);
    assert.equal((await db.query('select * from solicitacoes_analise_profissional')).rows.length,0);
    await assert.rejects(db.query('insert into solicitacoes_analise_profissional(usuario_id) values($1)',[id(n)]),/row-level security/);
  }
  await entrar(1);
  await assert.rejects(db.query('insert into solicitacoes_analise_profissional(usuario_id) values($1)',[id(8)]),/row-level security/);
  await assert.rejects(db.exec("update solicitacoes_analise_profissional set estado='aprovado'"),/permission denied/);
  await assert.rejects(db.query("insert into solicitacoes_analise_profissional(usuario_id,estado) values($1,'aprovado')",[id(1)]),/permission denied/);
  await assert.rejects(db.exec('delete from solicitacoes_analise_profissional'),/permission denied/);
  await assert.rejects(db.exec('update profissionais set publicado=true'),/permission denied/);
  await entrar(1,true);
  assert.equal((await db.query('select * from solicitacoes_analise_profissional')).rows.length,0);
  await db.exec('reset role;set role anon');
  await assert.rejects(db.exec('select * from solicitacoes_analise_profissional'),/permission denied/);
  await db.exec('reset role');
  assert.equal((await db.query('select count(*)::int as n from profissionais where publicado')).rows[0].n,1);
  assert.equal((await db.query('select count(*)::int as n from solicitacoes_analise_profissional')).rows[0].n,6);
});
