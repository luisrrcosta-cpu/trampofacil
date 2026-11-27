import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import postgres from 'postgres';
import {prepararRascunhoContrato,serializarRascunhoContrato} from '../contratos-core.js';

const url=new URL(process.env.TRAMPOFACIL_PG_CONCURRENCY_URL || 'http://invalido');
assert.ok(url.protocol==='postgres:' && ['127.0.0.1','localhost'].includes(url.hostname) &&
 url.pathname==='/trampofacil_contratos_test' && !url.search && !url.hash,
 'Somente banco descartável de contratos em loopback.');
const options={max:1,prepare:false,connect_timeout:5,connection:{statement_timeout:10000,lock_timeout:7000}};
const admin=postgres(url.href,options),a=postgres(url.href,options),b=postgres(url.href,options);
const resultado=p=>Promise.resolve(p).then(value=>({value}),error=>({error}));
try {
 assert.equal((await admin`select current_database() nome`)[0].nome,'trampofacil_contratos_test');
 assert.equal((await admin`select count(*)::int n from information_schema.tables where table_schema in ('public','private','auth')`)[0].n,0,'Exige banco vazio; não reutilize dados.');
 await admin.unsafe(`create role anon;create role authenticated;create role service_role;
 create schema auth;create schema private;create table auth.users(id uuid primary key);
 create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),not_after timestamptz);
 create function auth.jwt() returns jsonb language sql stable as $$select current_setting('request.jwt.claims',true)::jsonb$$;
 create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
 create table public.solicitacoes(id uuid primary key,cliente_usuario_id uuid,profissional_usuario_id uuid,status text,valor_centavos integer,atualizado_em timestamptz);`);
 for(const file of ['versoes_rascunho_contrato.sql','aceites_rascunho_contrato.sql'])
  await admin.unsafe(await readFile(new URL('../supabase/homologacao/'+file,import.meta.url),'utf8'));
 const cliente=randomUUID(),profissional=randomUUID(),sessao=randomUUID();
 await admin`insert into auth.users values(${cliente}),(${profissional})`;
 await admin`insert into auth.sessions values(${sessao},${cliente},null)`;
 const claims=JSON.stringify({sub:cliente,role:'authenticated',is_anonymous:false,session_id:sessao,exp:Math.floor(Date.now()/1000)+3600});
 for(const c of [admin,a,b])await c`select set_config('request.jwt.claims',${claims},false)`;
 const pid=(await b`select pg_backend_pid() pid`)[0].pid;
 const esperarLock=async()=>{
  const fim=Date.now()+5000;
  while(Date.now()<fim){
   const rows=await admin`select wait_event_type from pg_stat_activity where pid=${pid}`;
   if(rows[0]?.wait_event_type==='Lock')return;
   await new Promise(r=>setTimeout(r,30));
  }
  throw new Error('Segunda conexão não disputou o lock esperado');
 };
 const criar=async()=>{
  const pedido=randomUUID(),em='2026-11-27T15:00:00Z';
  await admin`insert into solicitacoes values(${pedido},${cliente},${profissional},'proposta',10000,${em})`;
  const dados={solicitacao_id:pedido,cliente_usuario_id:cliente,profissional_usuario_id:profissional,versao_minuta:'ensaio-v1',escopo:'Pintura interna conforme orçamento.',materiais_descricao:'Materiais do cliente.',mao_obra_centavos:10000,materiais_centavos:0,total_centavos:10000,inicio_previsto:'2026-12-01',fim_previsto:'2026-12-03',condicoes:'Condições apenas de ensaio técnico.'};
  const inserir=async(c,anterior=null,condicoes=dados.condicoes)=>{
   const entrada={...dados,condicoes};
   return (await c`insert into private.versoes_rascunho_contrato(solicitacao_id,orcamento_em,snapshot,conteudo_serializado,anterior_id,autor_usuario_id,criado_em,hash_sha256)
   values(${pedido},${em},${c.json(prepararRascunhoContrato(entrada))},${serializarRascunhoContrato(entrada)},${anterior},${cliente},now(),${'0'.repeat(64)}) returning *`)[0];
  };
  const versao=await inserir(admin),op=randomUUID();
  const aceitar=c=>c`insert into private.aceites_rascunho_contrato(versao_id,usuario_id,papel,sessao_id,operacao_id,hash_exibido,declaracao_confirmada,criado_em)
   values(${versao.id},${cliente},'cliente',${sessao},${op},${versao.hash_sha256},true,now()) returning *`;
  return {pedido,inserir,versao,aceitar};
 };
 // Revisão ganha a disputa: aceite da versão anterior deve falhar após esperar.
 let f=await criar();await a`begin`;
 const nova=await f.inserir(a,f.versao.id,'Condições revisadas antes do aceite.');
 let pendente=resultado(f.aceitar(b));await esperarLock();await a`commit`;
 assert.equal((await pendente).error?.code,'40001');assert.equal(nova.revisao,2);
 console.log('PASS revisão concorrente impede aceite obsoleto');
 // Aceite ganha: evidência histórica preservada; nova versão não herda aceite.
 f=await criar();await a`begin`;await f.aceitar(a);
 pendente=resultado(f.inserir(b,f.versao.id,'Condições posteriores ao aceite.'));await esperarLock();await a`commit`;
 const posterior=(await pendente).value;assert.equal(posterior.revisao,2);
 assert.equal((await admin`select count(*)::int n from private.aceites_rascunho_contrato where versao_id=${posterior.id}`)[0].n,0);
 assert.equal((await admin`select count(*)::int n from private.aceites_rascunho_contrato where versao_id=${f.versao.id}`)[0].n,1);
 console.log('PASS nova revisão não herda aceite anterior');
 // Dois envios da mesma operação nunca criam dois aceites.
 f=await criar();await a`begin`;await f.aceitar(a);
 pendente=resultado(f.aceitar(b));await esperarLock();await a`commit`;
 assert.equal((await pendente).error?.code,'23505');
 assert.equal((await admin`select count(*)::int n from private.aceites_rascunho_contrato where versao_id=${f.versao.id}`)[0].n,1);
 console.log('PASS envio concorrente não duplica evidência');
 // Revogação vence: token ainda não expirado não basta para aceitar.
 f=await criar();await a`begin`;await a`delete from auth.sessions where id=${sessao}`;
 pendente=resultado(f.aceitar(b));await esperarLock();await a`commit`;
 assert.equal((await pendente).error?.code,'42501');
 assert.equal((await admin`select count(*)::int n from private.aceites_rascunho_contrato where versao_id=${f.versao.id}`)[0].n,0);
 console.log('PASS sessão revogada durante disputa impede aceite');
}finally{
 await Promise.allSettled([a.unsafe('rollback'),b.unsafe('rollback')]);
 await Promise.all([admin.end(),a.end(),b.end()]);
}
