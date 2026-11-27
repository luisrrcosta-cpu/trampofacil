import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {prepararRascunhoContrato,serializarRascunhoContrato} from '../contratos-core.js';

async function preparar(t){
 const db=new PGlite();t.after(()=>db.close());
 const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
 await db.exec(`create role anon;create role authenticated;create role service_role;
 create schema auth;create schema private;grant usage on schema auth,private to anon,authenticated,service_role;
 create table auth.users(id uuid primary key); create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),not_after timestamptz);
 create function auth.jwt() returns jsonb language sql stable as $$select current_setting('request.jwt.claims',true)::jsonb$$;
 create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
 create table public.solicitacoes(id uuid primary key,cliente_usuario_id uuid,profissional_usuario_id uuid,status text,valor_centavos integer,atualizado_em timestamptz);
 `);
 for(let n=1;n<=4;n++)await db.query('insert into auth.users values($1)',[id(n)]);
 const horario='2026-11-27T15:00:00Z';
 await db.query("insert into solicitacoes values($1,$2,$3,'proposta',10000,$4)",[id(1),id(2),id(3),horario]);
 await db.exec(await readFile(new URL('../supabase/homologacao/versoes_rascunho_contrato.sql',import.meta.url),'utf8'));
 const assumir=(n,extra={})=>db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:id(n),is_anonymous:false,...extra})]);
 const dados=()=>({solicitacao_id:id(1),cliente_usuario_id:id(2),profissional_usuario_id:id(3),versao_minuta:'ensaio-v1',escopo:'Pintura de parede interna conforme orçamento.',materiais_descricao:'Materiais do cliente.',mao_obra_centavos:10000,materiais_centavos:0,total_centavos:10000,inicio_previsto:'2026-12-01',fim_previsto:'2026-12-03',condicoes:'Condições de ensaio ainda sem aceite.'});
 const inserir=(snapshot=prepararRascunhoContrato(dados()),texto=serializarRascunhoContrato(dados()),anterior=null,em=horario)=>db.query(
  'insert into private.versoes_rascunho_contrato(solicitacao_id,orcamento_em,snapshot,conteudo_serializado,anterior_id,autor_usuario_id,criado_em,hash_sha256) values($1,$2,$3::jsonb,$4,$5,$6,$7,$8) returning *',
  [id(1),em,snapshot,texto,anterior,id(4),'2000-01-01T00:00:00Z','0'.repeat(64)]);

 await db.exec(await readFile(new URL('../supabase/homologacao/aceites_rascunho_contrato.sql',import.meta.url),'utf8'));
 for(const n of [2,3,4])await db.query('insert into auth.sessions values($1,$2,null)',[id(n+10),id(n)]);
 const entrar=(n,extra={})=>assumir(n,{role:'authenticated',session_id:id(n+10),exp:Math.floor(Date.now()/1000)+3600,...extra});
 await entrar(2);
 const primeira=(await inserir()).rows[0];
 const aceitar=(versao=primeira,op=id(90),hash=versao.hash_sha256,sim=true)=>db.query(
 'insert into private.aceites_rascunho_contrato(versao_id,usuario_id,papel,sessao_id,operacao_id,hash_exibido,declaracao_confirmada,criado_em) values($1,$2,$3,$4,$5,$6,$7,$8) returning *',
 [versao.id,id(4),'profissional',id(14),op,hash,sim,'2000-01-01']);
 return {db,id,entrar,primeira,aceitar,inserir,dados,horario};
}
test('aceites privados derivam ator, papel, sessão e data; cada parte aceita uma vez',async t=>{
 const {db,id,entrar,aceitar}=await preparar(t);
 const a=(await aceitar()).rows[0];
 assert.equal(a.usuario_id,id(2));assert.equal(a.papel,'cliente');assert.equal(a.sessao_id,id(12));
 assert.notEqual(new Date(a.criado_em).getUTCFullYear(),2000);
 await assert.rejects(aceitar(),/unique constraint/);
 await entrar(3);const b=(await aceitar()).rows[0];assert.equal(b.papel,'profissional');assert.equal(b.usuario_id,id(3));
 assert.equal((await db.query('select count(*)::int n from private.aceites_rascunho_contrato')).rows[0].n,2);
 await assert.rejects(db.exec('update private.aceites_rascunho_contrato set papel=papel'),/imutáveis/);
 await assert.rejects(db.exec('delete from private.aceites_rascunho_contrato'),/imutáveis/);
});
test('aceite rejeita terceiro, sessão ausente, revogada, alheia, anônima e expirada',async t=>{
 const {db,id,entrar,aceitar}=await preparar(t);
 await entrar(4);await assert.rejects(aceitar(),/indisponível/);
 for(const claims of [{is_anonymous:true},{role:'service_role'},{session_id:null},{session_id:id(99)},{session_id:id(13)},{exp:0},{exp:null}]){
 await entrar(2,claims);await assert.rejects(aceitar(),/Sessão/);
 }
 await entrar(2);await db.query('update auth.sessions set not_after=$1 where id=$2',['2000-01-01',id(12)]);
 await assert.rejects(aceitar(),/Sessão/);
 await db.query('delete from auth.sessions where id=$1',[id(12)]);await assert.rejects(aceitar(),/Sessão/);
 assert.equal((await db.query('select count(*)::int n from private.aceites_rascunho_contrato')).rows[0].n,0);
});
test('aceite exige hash exibido e declaração positiva; nenhum papel comum acessa tabela',async t=>{
 const {db,aceitar,primeira}=await preparar(t);
 await assert.rejects(aceitar(primeira,undefined,'0'.repeat(64)),/expressamente/);
 await assert.rejects(aceitar(primeira,undefined,undefined,false),/expressamente/);
 await assert.rejects(aceitar(primeira,undefined,undefined,null),/expressamente/);
 for(const role of ['anon','authenticated','service_role']){
 await db.exec('set role '+role);
 await assert.rejects(db.exec('select * from private.aceites_rascunho_contrato'),/permission denied/);
 await assert.rejects(aceitar(),/permission denied/);await db.exec('reset role');
 }
 assert.equal((await db.query("select relrowsecurity from pg_class where oid='private.aceites_rascunho_contrato'::regclass")).rows[0].relrowsecurity,true);
});
test('nova revisão invalida novos aceites da anterior e preserva evidência antiga',async t=>{
 const {db,id,entrar,primeira,aceitar,inserir,dados}=await preparar(t);
 await aceitar();const novo={...dados(),condicoes:'Condições de uma segunda revisão de ensaio.'};
 const segunda=(await inserir(prepararRascunhoContrato(novo),serializarRascunhoContrato(novo),primeira.id)).rows[0];
 await entrar(3);await assert.rejects(aceitar(primeira),/Contrato mudou/);
 await aceitar(segunda);
 assert.equal((await db.query('select count(*)::int n from private.aceites_rascunho_contrato')).rows[0].n,2);
 await entrar(2);await assert.rejects(aceitar(segunda),/unique constraint/);
 await aceitar(segunda,id(91));
 assert.equal((await db.query('select count(*)::int n from private.aceites_rascunho_contrato where versao_id=$1',[segunda.id])).rows[0].n,2);
});
test('mudança de valor, data, partes ou estado do pedido bloqueia aceite sem alterar pedido',async t=>{
 const {db,id,aceitar,horario}=await preparar(t);
 for(const [col,value] of [['valor_centavos',12000],['atualizado_em','2026-11-28T00:00:00Z'],['status','cancelada'],['cliente_usuario_id',id(4)]]){
 await db.query('update solicitacoes set '+col+'=$1 where id=$2',[value,id(1)]);
 await assert.rejects(aceitar(),/Contrato mudou|indisponível/);
 await db.query("update solicitacoes set valor_centavos=10000,atualizado_em=$1,status='proposta',cliente_usuario_id=$2 where id=$3",[horario,id(2),id(1)]);
 }
 assert.equal((await db.query('select count(*)::int n from private.aceites_rascunho_contrato')).rows[0].n,0);
 assert.equal((await db.query('select status from solicitacoes')).rows[0].status,'proposta');
});
