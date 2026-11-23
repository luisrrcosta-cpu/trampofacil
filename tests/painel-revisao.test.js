import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('painel administrativo exige revisor ativo em cada RPC e preserva tabelas privadas',async t=>{
  const db=new PGlite();t.after(()=>db.close());
  const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
  await db.exec(`
    create role anon;create role authenticated;create role service_role;
    create schema auth;create schema private;
    grant usage on schema auth, private to authenticated,anon,service_role;
    create table auth.users(id uuid primary key);
    create function auth.jwt() returns jsonb language sql stable as
      $$select current_setting('request.jwt.claims',true)::jsonb$$;
    create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
    create table profissionais(usuario_id uuid primary key,nome text,cidade text,servico text,
      descricao text,tipo_prestador text,tipo_atividade text,publicado boolean,pausado boolean);
    create table solicitacoes_analise_profissional(usuario_id uuid primary key,estado text,criado_em timestamptz);
  `);
  for(let n=1;n<=4;n++)await db.query('insert into auth.users values($1)',[id(n)]);
  for(let n=1;n<=3;n++)await db.query(
    "insert into profissionais values($1,'Perfil','Cidade','Costura',null,'pessoa_fisica','ocasional',false,true)",[id(n)]);
  for(let n=1;n<=2;n++)await db.query(
    "insert into solicitacoes_analise_profissional values($1,'aguardando_analise',now())",[id(n)]);
  await db.exec(await readFile(new URL('../supabase/homologacao/estrutura_interna_revisao_perfis.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/homologacao/painel_revisao_perfis.sql',import.meta.url),'utf8'));
  await db.exec('revoke usage on schema private from authenticated');
  const entrar=async(n,extra={})=>{
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:id(n),is_anonymous:false,...extra})]);
    await db.exec('set role authenticated');
  };
  const listar=(pagina=0)=>db.query('select public.listar_perfis_revisao($1) as fila',[pagina]);
  const esperado={nome:'Perfil',cidade:'Cidade',servico:'Costura',descricao:null,tipo_prestador:'pessoa_fisica',tipo_atividade:'ocasional'};
  const aprovar=(alvo=id(1),versao=esperado)=>db.query('select public.aprovar_perfil_administrativo($1,$2::jsonb) as id',[alvo,versao]);
  await entrar(4,{user_metadata:{admin:true}});
  await assert.rejects(listar(),/Área restrita/);
  await assert.rejects(aprovar(),/não autorizado/);
  await db.exec('reset role');
  await db.query('insert into private.revisores_perfil(usuario_id) values($1)',[id(4)]);
  await entrar(4);
  const fila=(await listar()).rows[0].fila;
  assert.equal(fila.length,2);
  assert.deepEqual(Object.keys(fila[0]).sort(),['perfil','solicitado_em','usuario_id']);
  assert.deepEqual(Object.keys(fila[0].perfil).sort(),Object.keys(esperado).sort());
  for(const invalida of [-1,10001,null])await assert.rejects(listar(invalida),/Página inválida/);
  await assert.rejects(db.exec('select * from private.revisores_perfil'),/permission denied/);
  await assert.rejects(db.exec('update profissionais set publicado=true'),/permission denied/);
  await assert.rejects(aprovar(id(1),{...esperado,nome:'Outra versão'}),/Perfil mudou/);
  const evento=(await aprovar()).rows[0].id;
  assert.equal((await aprovar()).rows[0].id,evento);
  assert.equal((await listar()).rows[0].fila.length,1);
  await assert.rejects(aprovar(id(4)),/não autorizado/);
  await entrar(4,{is_anonymous:true});
  await assert.rejects(listar(),/Área restrita/);
  await assert.rejects(aprovar(),/autenticado obrigatório/);
  await db.exec('reset role');
  await db.query('update private.revisores_perfil set ativo=false where usuario_id=$1',[id(4)]);
  await entrar(4);
  await assert.rejects(listar(),/Área restrita/);
  await assert.rejects(aprovar(),/não autorizado/);
  await db.exec('reset role;set role anon');
  await assert.rejects(listar(),/permission denied/);
  await assert.rejects(aprovar(),/permission denied/);
  await db.exec('reset role');
  assert.equal((await db.query('select count(*)::int as n from private.aprovacoes_perfil')).rows[0].n,1);
  const perfil=(await db.query('select publicado,pausado from profissionais where usuario_id=$1',[id(1)])).rows[0];
  assert.deepEqual(perfil,{publicado:true,pausado:true});
  const funcoes=(await db.query("select n.nspname,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname in ('listar_perfis_revisao','aprovar_perfil_administrativo')")).rows;
  assert.equal(funcoes.length,2);
  assert.ok(funcoes.every(f=>!f.prosecdef));
});
