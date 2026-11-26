import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const sqlContratacao=await readFile(new URL('../supabase/migrations/20261126223635_avisos_contratacao_homologacao.sql',import.meta.url),'utf8');
const sqlAndamento=await readFile(new URL('../supabase/migrations/20261126220117_acompanhamento_reclamacoes_homologacao.sql',import.meta.url),'utf8');
const sqlAvisos=await readFile(new URL('../supabase/migrations/20261126222715_avisos_atendimento_homologacao.sql',import.meta.url),'utf8');
const sql=await readFile(new URL('../supabase/migrations/20261126214707_reclamacoes_servico_homologacao.sql',import.meta.url),'utf8');
test('avisos de contratação: histórico existente, destinatário, todas as etapas e leitura privada',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 const cliente='11111111-1111-4111-8111-111111111111',prof='22222222-2222-4222-8222-222222222222',outro='33333333-3333-4333-8333-333333333333',revisor='44444444-4444-4444-8444-444444444444';
 const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create schema private;create schema revisao_admin;
 grant usage on schema auth to public;grant usage on schema revisao_admin to authenticated;
 create table auth.users(id uuid primary key);create function auth.jwt() returns jsonb language sql stable as $$select current_setting('request.jwt.claims',true)::jsonb$$;
 create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
 create table private.revisores_perfil(usuario_id uuid primary key,ativo boolean);
 create table public.solicitacoes(id uuid primary key,cliente_usuario_id uuid,profissional_usuario_id uuid,status text,valor_centavos int,titulo text);
 alter table public.solicitacoes enable row level security;grant select on public.solicitacoes to authenticated;
 create policy partes on public.solicitacoes for select to authenticated using((select auth.uid()) in(cliente_usuario_id,profissional_usuario_id));
 insert into auth.users values('${cliente}'),('${prof}'),('${outro}'),('${revisor}');
 insert into private.revisores_perfil values('${revisor}',true);`);
 for(let n=1;n<=5;n++)await db.query('insert into solicitacoes values($1,$2,$3,$4,10000,$5)',[id(n),cliente,prof,n===1?'concluida':'aceita','Pedido fictício '+n]);
 await db.exec(sql);await db.exec(sqlAndamento);await db.exec(sqlAvisos);await db.exec('create table public.historico_solicitacoes(id uuid primary key,solicitacao_id uuid references solicitacoes(id),ator_usuario_id uuid references auth.users(id),status text,valor_centavos integer,criado_em timestamptz default now())');await db.exec(sqlContratacao);


 const entrar=async(u,anonimo=false,role='authenticated')=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:u,is_anonymous:anonimo})]);await db.exec('set role '+role);};
 const listar=async(cursor=null)=>(await db.query('select listar_avisos_atendimento($1,$2,$3) as itens',cursor?[cursor.criado_em,cursor.tipo,cursor.evento_id]:[null,null,null])).rows[0].itens;
 const marcar=async(evento)=>(await db.query("select marcar_aviso_atendimento_lido('contratacao',$1) as hora",[id(evento)])).rows[0].hora;
 const etapas=[['solicitada',cliente],['proposta',prof],['proposta',prof],['aceita',cliente],['em_andamento',prof],['entregue',prof],['concluida',cliente],['cancelada',cliente],['cancelada',prof]];
 await db.exec('reset role');for(const [i,[status,ator]] of etapas.entries())await db.query('insert into historico_solicitacoes values($1,$2,$3,$4,10000,$5)',[id(100+i),id(1),ator,status,'2026-11-26T12:00:00.123456Z']);
 // Eventos desconhecidos ou de ator fora das partes não geram avisos.
 for(const [n,status,ator]of [[120,'solicitada',outro],[121,'desconhecido',prof]])await db.query('insert into historico_solicitacoes values($1,$2,$3,$4,10000,now())',[id(n),id(1),ator,status]);
 await entrar(cliente);const recebidos=await listar();assert.equal(recebidos.length,5);assert.deepEqual(new Set(recebidos.map(x=>x.status)),new Set(['proposta','em_andamento','entregue','cancelada']));
 assert.ok(recebidos.every(x=>x.tipo==='contratacao'&&!Object.hasOwn(x,'ator_usuario_id')&&!Object.hasOwn(x,'valor_centavos')));
 const hora=await marcar(101);assert.equal(String(await marcar(101)),String(hora));assert.ok((await listar()).find(x=>x.evento_id===id(101)).lido_em);
 await assert.rejects(marcar(100),/Aviso indisponível/);await assert.rejects(marcar(120),/Aviso indisponível/);await assert.rejects(marcar(121),/Aviso indisponível/);
 await entrar(prof);const profissionais=await listar();assert.equal(profissionais.length,4);assert.deepEqual(new Set(profissionais.map(x=>x.status)),new Set(['solicitada','aceita','concluida','cancelada']));
 assert.ok(profissionais.every(x=>x.lido_em===null));await marcar(100);await assert.rejects(marcar(101),/Aviso indisponível/);
 await entrar(outro);assert.equal((await listar()).length,0);await assert.rejects(marcar(100),/Aviso indisponível/);
 await entrar(revisor);assert.equal((await listar()).length,0);await assert.rejects(marcar(101),/Aviso indisponível/);
 await entrar(cliente,true);await assert.rejects(listar(),/Entre na sua conta/);await assert.rejects(marcar(101),/Entre na sua conta/);
 for(const role of ['anon','service_role']){await entrar(cliente,false,role);await assert.rejects(listar(),/permission denied/);await assert.rejects(marcar(101),/permission denied/);}
 await db.exec('reset role');
 for(let n=200;n<260;n++)await db.query("insert into historico_solicitacoes values($1,$2,$3,'proposta',10000,'2026-11-26T12:00:00.123456Z')",[id(n),id(1),prof]);
 await entrar(cliente);const primeira=await listar();assert.equal(primeira.length,51);const segunda=await listar(primeira[49]);assert.equal(segunda.length,15);assert.equal(new Set([...primeira.slice(0,50),...segunda].map(x=>x.evento_id)).size,65);
 await db.exec('reset role');assert.equal((await db.query('select count(*)::int as n from historico_solicitacoes')).rows[0].n,71);
 assert.equal((await db.query('select status,valor_centavos from solicitacoes where id=$1',[id(1)])).rows[0].status,'concluida');
 assert.equal((await db.query('select valor_centavos from solicitacoes where id=$1',[id(1)])).rows[0].valor_centavos,10000);
 assert.equal((await db.query('select count(*)::int as n from private.leituras_avisos_atendimento')).rows[0].n,2);
});
