import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('orientações de cadastro são privadas, idempotentes e não publicam perfis',async t=>{
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
  await db.exec(await readFile(new URL('../supabase/homologacao/orientacao_ajustes_perfil.sql',import.meta.url),'utf8'));
  const entrar=async(n,extra={})=>{
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:id(n),is_anonymous:false,...extra})]);
    await db.exec('set role authenticated');
  };
  const esperado={nome:'Perfil',cidade:'Cidade',servico:'Costura',descricao:null,tipo_prestador:'pessoa_fisica',tipo_atividade:'ocasional'};
  const pedir=(alvo=id(1),perfil=esperado,motivo='detalhar_servico')=>db.query('select public.pedir_ajuste_perfil($1,$2::jsonb,$3) as id',[alvo,perfil,motivo]);
  const ler=()=>db.query('select public.consultar_orientacao_perfil() as orientacao');
  await entrar(4,{user_metadata:{admin:true}});
  await assert.rejects(pedir(),/não autorizado/);
  await db.exec('reset role');
  await db.query('insert into private.revisores_perfil(usuario_id) values($1)',[id(4)]);
  await entrar(4);
  await assert.rejects(pedir(id(4)),/não autorizado/);
  await assert.rejects(pedir(id(3)),/Pedido de análise obrigatório/);
  await assert.rejects(pedir(id(1),esperado,'exigir_documento'),/Motivo inválido/);
  await assert.rejects(pedir(id(1),{...esperado,nome:'Versão antiga'}),/Perfil mudou/);
  const primeiro=(await pedir()).rows[0].id;
  assert.equal((await pedir()).rows[0].id,primeiro);
  await assert.rejects(db.exec('select * from private.ajustes_perfil'),/permission denied/);
  await entrar(1);
  const orientacao=(await ler()).rows[0].orientacao;
  assert.equal(orientacao.length,1);
  assert.deepEqual(Object.keys(orientacao[0]).sort(),['criado_em','motivo','perfil_alterado']);
  assert.equal(orientacao[0].motivo,'detalhar_servico');
  assert.equal(orientacao[0].perfil_alterado,false);
  await assert.rejects(pedir(),/não autorizado/);
  await entrar(2);
  assert.deepEqual((await ler()).rows[0].orientacao,[]);
  await entrar(1,{is_anonymous:true});
  await assert.rejects(ler(),/autenticada obrigatória/);
  await db.exec('reset role');
  await db.query("update profissionais set descricao='Descrição corrigida' where usuario_id=$1",[id(1)]);
  await entrar(1);
  assert.equal((await ler()).rows[0].orientacao[0].perfil_alterado,true);
  await db.exec('reset role');
  assert.equal((await db.query('select count(*)::int as n from private.ajustes_perfil')).rows[0].n,1);
  assert.equal((await db.query('select publicado from profissionais where usuario_id=$1',[id(1)])).rows[0].publicado,false);
  await db.query('update private.revisores_perfil set ativo=false where usuario_id=$1',[id(4)]);
  await entrar(4);
  await assert.rejects(pedir(),/não autorizado/);
  await db.exec('reset role;set role anon');
  await assert.rejects(ler(),/permission denied/);
  await assert.rejects(pedir(),/permission denied/);
  await db.exec('reset role');
  await db.query('update profissionais set publicado=true where usuario_id=$1',[id(1)]);
  await entrar(1);
  assert.deepEqual((await ler()).rows[0].orientacao,[],'publicação concluída deixa de exibir ajuste pendente');
});
