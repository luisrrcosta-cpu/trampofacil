import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const sqlMensagens=await readFile(new URL('../supabase/migrations/20261126224825_avisos_mensagens_homologacao.sql',import.meta.url),'utf8');
const sqlContratacao=await readFile(new URL('../supabase/migrations/20261126223635_avisos_contratacao_homologacao.sql',import.meta.url),'utf8');
const sqlAndamento=await readFile(new URL('../supabase/migrations/20261126220117_acompanhamento_reclamacoes_homologacao.sql',import.meta.url),'utf8');
const sqlAvisos=await readFile(new URL('../supabase/migrations/20261126222715_avisos_atendimento_homologacao.sql',import.meta.url),'utf8');
const sql=await readFile(new URL('../supabase/migrations/20261126214707_reclamacoes_servico_homologacao.sql',import.meta.url),'utf8');
test('avisos de mensagens: contraparte, conteúdo reservado à conversa e leituras anteriores preservadas',async t=>{
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
 const marcar=async(evento,tipo='mensagem')=>(await db.query('select marcar_aviso_atendimento_lido($1,$2) as hora',[tipo,id(evento)])).rows[0].hora;
 await entrar(cliente);await db.query("insert into reclamacoes_servico(solicitacao_id,motivo,descricao) values($1,'qualidade','O serviço apresentou um problema.')",[id(1)]);
 await entrar(revisor);await db.query("select atualizar_acompanhamento_reclamacao($1,$2,0,'em_analise','Atendimento analisando o problema relatado.')",[id(1),id(100)]);
 await entrar(cliente);const leituraAnterior=await marcar(100,'administracao');
 await db.exec('reset role');await db.exec('create table public.mensagens_solicitacoes(id uuid primary key,solicitacao_id uuid references solicitacoes(id),autor_usuario_id uuid references auth.users(id),texto text,criado_em timestamptz default now())');
 await db.query("insert into solicitacoes values($1,$2,$3,'concluida',10000,'Pedido de outra pessoa')",[id(6),outro,revisor]);
 for(const [n,pedido,autor,corpo]of [[100,id(1),prof,'CONTEÚDO PRIVADO DO PROFISSIONAL'],[101,id(1),cliente,'CONTEÚDO PRIVADO DO CLIENTE'],[102,id(1),outro,'Autor de fora não deve notificar'],[103,id(6),prof,'Pedido alheio não deve notificar']])await db.query("insert into mensagens_solicitacoes values($1,$2,$3,$4,'2026-11-26T12:00:00.123456Z')",[id(n),pedido,autor,corpo]);
 await db.exec(sqlMensagens);
 await entrar(cliente);const recebidos=await listar();assert.equal(recebidos.length,2);
 const mensagem=recebidos.find(x=>x.tipo==='mensagem');assert.equal(mensagem.evento_id,id(100));assert.equal(mensagem.status,null);
 assert.equal(String(new Date(recebidos.find(x=>x.tipo==='administracao').lido_em)),String(leituraAnterior));
 assert.ok(!JSON.stringify(recebidos).includes('CONTEÚDO PRIVADO'));assert.ok(!Object.hasOwn(mensagem,'texto'));assert.ok(!Object.hasOwn(mensagem,'autor_usuario_id'));
 const hora=await marcar(100);assert.equal(String(await marcar(100)),String(hora));await assert.rejects(marcar(101),/Aviso indisponível/);await assert.rejects(marcar(102),/Aviso indisponível/);await assert.rejects(marcar(103),/Aviso indisponível/);
 await entrar(prof);const dele=await listar();assert.equal(dele.length,2);assert.equal(dele.find(x=>x.tipo==='mensagem').evento_id,id(101));assert.ok(dele.every(x=>x.lido_em===null));await marcar(101);await assert.rejects(marcar(100),/Aviso indisponível/);
 for(const u of [outro,revisor]){await entrar(u);assert.equal((await listar()).length,0);await assert.rejects(marcar(100),/Aviso indisponível/);await assert.rejects(marcar(103),/Aviso indisponível/);}
 await entrar(cliente,true);await assert.rejects(listar(),/Entre na sua conta/);await assert.rejects(marcar(100),/Entre na sua conta/);
 for(const role of ['anon','service_role']){await entrar(cliente,false,role);await assert.rejects(listar(),/permission denied/);await assert.rejects(marcar(100),/permission denied/);}
 await db.exec('reset role');for(let n=200;n<260;n++)await db.query("insert into mensagens_solicitacoes values($1,$2,$3,'Texto que deve permanecer só na conversa','2026-11-26T12:00:00.123456Z')",[id(n),id(1),prof]);
 await entrar(cliente);const primeira=await listar();assert.equal(primeira.length,51);const segunda=await listar(primeira[49]);assert.equal(segunda.length,12);const todas=[...primeira.slice(0,50),...segunda];assert.equal(new Set(todas.map(x=>x.tipo+':'+x.evento_id)).size,62);assert.equal(todas.filter(x=>x.tipo==='mensagem').length,61);
 await db.exec('reset role');assert.equal((await db.query('select count(*)::int as n from mensagens_solicitacoes')).rows[0].n,64);assert.equal((await db.query('select texto from mensagens_solicitacoes where id=$1',[id(100)])).rows[0].texto,'CONTEÚDO PRIVADO DO PROFISSIONAL');
 assert.equal((await db.query('select status,valor_centavos from solicitacoes where id=$1',[id(1)])).rows[0].status,'concluida');
 assert.equal((await db.query('select valor_centavos from solicitacoes where id=$1',[id(1)])).rows[0].valor_centavos,10000);
 assert.equal((await db.query('select count(*)::int as n from private.leituras_avisos_atendimento')).rows[0].n,3);
});
