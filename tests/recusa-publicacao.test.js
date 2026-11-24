import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('recusa administrativa protege versão, identidade e dados do profissional',async t=>{
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
  await db.exec(await readFile(new URL('../supabase/homologacao/recusa_publicacao_perfil.sql',import.meta.url),'utf8'));
  const entrar=async(n,extra={})=>{
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:id(n),is_anonymous:false,...extra})]);
    await db.exec('set role authenticated');
  };
  const esperado={nome:'Perfil',cidade:'Cidade',servico:'Costura',descricao:null,tipo_prestador:'pessoa_fisica',tipo_atividade:'ocasional'};
  const recusar=(alvo=id(1),versao=esperado,motivo='servico_nao_identificavel')=>db.query('select public.recusar_publicacao_perfil($1,$2::jsonb,$3) as id',[alvo,versao,motivo]);
  const consultar=()=>db.query('select public.consultar_recusa_publicacao() as recusas');
  await entrar(4,{user_metadata:{admin:true}});
  await assert.rejects(recusar(),/não autorizado/);
  await db.exec('reset role');
  await db.query('insert into private.revisores_perfil(usuario_id) values($1)',[id(4)]);
  await entrar(4);
  await assert.rejects(recusar(id(4)),/não autorizado/);
  await assert.rejects(recusar(id(3)),/Pedido de análise obrigatório/);
  await assert.rejects(recusar(id(1),esperado,'exigir_cnpj'),/Motivo inválido/);
  await assert.rejects(recusar(id(1),{...esperado,nome:'Outra versão'}),/Perfil mudou/);
  const primeiro=(await recusar()).rows[0].id;
  assert.equal((await recusar()).rows[0].id,primeiro);
  const fila=(await db.query('select public.listar_perfis_revisao(0) as fila')).rows[0].fila;
  assert.equal(fila.find(p=>p.usuario_id===id(1)).recusa.motivo,'servico_nao_identificavel');
  await assert.rejects(db.exec('select * from private.recusas_publicacao_perfil'),/permission denied/);
  await entrar(1);
  const propria=(await consultar()).rows[0].recusas;
  assert.equal(propria.length,1);
  assert.deepEqual(Object.keys(propria[0]).sort(),['criado_em','motivo','perfil_alterado']);
  assert.equal(propria[0].perfil_alterado,false);
  await assert.rejects(recusar(),/não autorizado/);
  await entrar(2);
  assert.deepEqual((await consultar()).rows[0].recusas,[]);
  await entrar(1,{is_anonymous:true});
  await assert.rejects(consultar(),/autenticada obrigatória/);
  await db.exec('reset role');
  await db.query("update profissionais set descricao='Corrigida' where usuario_id=$1",[id(1)]);
  await entrar(1);
  assert.equal((await consultar()).rows[0].recusas[0].perfil_alterado,true);
  await entrar(4);
  await assert.rejects(recusar(),/Perfil mudou/);
  const atual={...esperado,descricao:'Corrigida'};
  const segundo=(await recusar(id(1),atual,'informacoes_inconsistentes')).rows[0].id;
  assert.notEqual(segundo,primeiro);
  assert.equal((await recusar(id(1),atual,'informacoes_inconsistentes')).rows[0].id,segundo);
  await db.query('select public.aprovar_perfil_administrativo($1,$2::jsonb)',[id(1),atual]);
  await assert.rejects(recusar(id(1),atual),/Perfil indisponível/);
  await entrar(1);
  assert.deepEqual((await consultar()).rows[0].recusas,[],'aprovação posterior permite encerrar a recusa na visão pendente');
  await db.exec('reset role');
  assert.equal((await db.query('select count(*)::int as n from private.recusas_publicacao_perfil')).rows[0].n,2);
  assert.equal((await db.query('select pausado from profissionais where usuario_id=$1',[id(1)])).rows[0].pausado,true);
  await db.query('update private.revisores_perfil set ativo=false where usuario_id=$1',[id(4)]);
  await entrar(4);
  await assert.rejects(recusar(id(2)),/não autorizado/);
  await db.exec('reset role;set role anon');
  await assert.rejects(consultar(),/permission denied/);
  await assert.rejects(recusar(),/permission denied/);
});
