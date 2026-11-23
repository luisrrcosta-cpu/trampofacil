import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('mudança material retira publicação e catálogo; telefone e salvamento sem mudança preservam aprovação',async t=>{
  const db=new PGlite();t.after(()=>db.close());
  const uid='11111111-1111-4111-8111-111111111111';
  await db.exec(`
    create role anon;create role authenticated;create role service_role;
    create schema private;create schema auth;grant usage on schema auth to public;
    create function auth.uid() returns uuid language sql stable as
      $$ select current_setting('app.usuario',true)::uuid $$;
    create table profissionais(id uuid primary key,usuario_id uuid unique,nome text,cidade text,servico text,descricao text,telefone text,publicado boolean,tipo_prestador text,tipo_atividade text);
    create table catalogo_profissionais(id uuid primary key,nome text,cidade text,servico text,descricao text,ativo boolean);
    alter table profissionais enable row level security;
    alter table catalogo_profissionais enable row level security;
    grant select on profissionais to authenticated;
    grant update(nome,cidade,servico,descricao,telefone,tipo_prestador,tipo_atividade) on profissionais to authenticated;
    grant select on catalogo_profissionais to anon;
    create policy titular on profissionais to authenticated using(usuario_id=(select auth.uid())) with check(usuario_id=(select auth.uid()));
    create policy ativos on catalogo_profissionais for select to anon using(ativo);
    -- Reprodução do sincronizador já existente em homologação, não é parte da migração.
    create function private.sincronizar_catalogo() returns trigger language plpgsql security definer set search_path='' as $$
    begin
      insert into public.catalogo_profissionais values(new.id,new.nome,new.cidade,new.servico,new.descricao,new.publicado)
      on conflict(id) do update set nome=excluded.nome,cidade=excluded.cidade,servico=excluded.servico,descricao=excluded.descricao,ativo=excluded.ativo;
      return new;
    end;
    $$;
    create trigger sincronizar_catalogo after insert or update on profissionais for each row execute function private.sincronizar_catalogo();
    insert into profissionais values('${uid}','${uid}','Pessoa de teste','Cidade','Costura','Reparos','11999999999',true,'pessoa_fisica','regular');
  `);
  await db.exec(await readFile(new URL('../supabase/homologacao/reavaliar_publicacao_profissional.sql',import.meta.url),'utf8'));
  assert.equal((await db.query('select publicado from profissionais')).rows[0].publicado,true,'instalação preserva registros');
  const entrar=()=>db.exec("set app.usuario='"+uid+"';set role authenticated");
  await entrar();
  await db.exec("update profissionais set telefone='11988888888',nome=nome,servico=servico,descricao=descricao");
  assert.equal((await db.query('select publicado from profissionais')).rows[0].publicado,true);
  await assert.rejects(db.exec('update profissionais set publicado=true'),/permission denied/);
  await db.exec('reset role');
  for(const [coluna,valor] of [['nome','Outro nome'],['cidade','Outra cidade'],['servico','Costura e ajustes'],['descricao',null],['tipo_prestador','mei'],['tipo_atividade','ocasional']]){
    await db.exec('update profissionais set publicado=true');
    await entrar();
    await db.query('update profissionais set '+coluna+'=$1',[valor]);
    assert.equal((await db.query('select publicado from profissionais')).rows[0].publicado,false,coluna);
    await db.exec('reset role;set role anon');
    assert.equal((await db.query('select * from catalogo_profissionais')).rows.length,0,'catálogo público não mostra alteração pendente');
    await db.exec('reset role');
  }
  assert.equal((await db.query("select prosecdef from pg_proc where oid='private.reavaliar_publicacao_profissional()'::regprocedure")).rows[0].prosecdef,false);
  assert.equal((await db.query('select count(*)::int as n from profissionais')).rows[0].n,1);
});
