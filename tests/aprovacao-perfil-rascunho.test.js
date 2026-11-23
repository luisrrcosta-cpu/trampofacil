import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('aprovação interna privada: sem privilégios comuns, sem autoaprovação e sem aprovar versão antiga',async t=>{
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
  const entrar=async(n,extra={})=>db.query("select set_config('request.jwt.claims',$1,false)",
    [JSON.stringify({sub:id(n),is_anonymous:false,...extra})]);
  const versao={nome:'Perfil',cidade:'Cidade',servico:'Costura',descricao:null,tipo_prestador:'pessoa_fisica',tipo_atividade:'ocasional'};
  const aprovar=(n,v=versao)=>db.query('select private.aprovar_perfil_revisado($1,$2::jsonb) as evento',[id(n),v]);
  await entrar(4,{user_metadata:{admin:true}});
  await assert.rejects(aprovar(1),/não autorizado/);
  await db.query('insert into private.revisores_perfil(usuario_id) values($1),($2)',[id(4),id(1)]);
  assert.equal((await db.query('select count(*)::int as n from private.eventos_revisores_perfil')).rows[0].n,2);
  await entrar(1);
  await assert.rejects(aprovar(1),/não autorizado/);
  await entrar(4,{is_anonymous:true});
  await assert.rejects(aprovar(1),/autenticado obrigatório/);
  await entrar(4);
  await assert.rejects(aprovar(3),/Pedido de análise obrigatório/);
  await db.query("update profissionais set tipo_atividade=null where usuario_id=$1",[id(2)]);
  await assert.rejects(aprovar(2),/Cadastro incompleto/);
  await db.query("update profissionais set descricao='Descrição nova' where usuario_id=$1",[id(1)]);
  await assert.rejects(aprovar(1),/Perfil mudou/);
  assert.equal((await db.query('select count(*)::int as n from private.aprovacoes_perfil')).rows[0].n,0);
  const atual={...versao,descricao:'Descrição nova'};
  const primeiro=(await aprovar(1,atual)).rows[0].evento;
  assert.equal((await aprovar(1,atual)).rows[0].evento,primeiro);
  const perfil=(await db.query('select * from profissionais where usuario_id=$1',[id(1)])).rows[0];
  assert.equal(perfil.publicado,true);
  assert.equal(perfil.pausado,true,'aprovação não retoma disponibilidade');
  assert.equal((await db.query('select count(*)::int as n from private.aprovacoes_perfil')).rows[0].n,1);
  await db.query('update private.revisores_perfil set ativo=false where usuario_id=$1',[id(4)]);
  await assert.rejects(aprovar(1,atual),/não autorizado/);
  const eventos=(await db.query('select operacao,ativo from private.eventos_revisores_perfil order by id')).rows;
  assert.deepEqual(eventos.map(e=>e.operacao),['INSERT','INSERT','UPDATE']);
  assert.equal(eventos[2].ativo,false);
  for(const role of ['anon','authenticated','service_role']){
    await db.exec('set role '+role);
    await assert.rejects(aprovar(1,atual),/permission denied/);
    await assert.rejects(db.exec('select * from private.revisores_perfil'),/permission denied/);
    await assert.rejects(db.exec('select * from private.aprovacoes_perfil'),/permission denied/);
    await db.exec('reset role');
  }
  const func=(await db.query("select prosecdef,proconfig from pg_proc where oid='private.aprovar_perfil_revisado(uuid,jsonb)'::regprocedure")).rows[0];
  assert.equal(func.prosecdef,false,'não executa com privilégios do criador');
  assert.ok(func.proconfig.some(c=>c.startsWith('search_path=')));
});
