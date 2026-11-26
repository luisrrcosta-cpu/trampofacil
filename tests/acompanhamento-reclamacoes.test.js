import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const sqlNovo=await readFile(new URL('../supabase/migrations/20261126220117_acompanhamento_reclamacoes_homologacao.sql',import.meta.url),'utf8');
const sql=await readFile(new URL('../supabase/migrations/20261126214707_reclamacoes_servico_homologacao.sql',import.meta.url),'utf8');
test('andamento: autorização, transições, idempotência, conflitos e histórico privado',async t=>{
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
 await db.exec(sql);await db.exec(sqlNovo);
 const entrar=async(u,anonimo=false,role='authenticated')=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:u,is_anonymous:anonimo})]);await db.exec('set role '+role);};
 const criar=(n,texto='O serviço apresentou problema de qualidade.')=>db.query("insert into reclamacoes_servico(solicitacao_id,motivo,descricao) values($1,'qualidade',$2)",[id(n),texto]);
 const responder=n=>db.query("insert into respostas_reclamacao(solicitacao_id,descricao) values($1,'Resposta inicial do profissional de teste.')",[id(n)]);
 await entrar(cliente);await criar(1);
 await assert.rejects(criar(1),/unique constraint/);
 await assert.rejects(criar(2,'curto'),/check constraint/);await assert.rejects(criar(2,'x'.repeat(2001)),/check constraint/);
 await assert.rejects(db.query("insert into reclamacoes_servico(solicitacao_id,motivo,descricao,cliente_usuario_id) values($1,'qualidade','Relato suficientemente longo',$2)",[id(2),outro]),/permission denied/);
 await assert.rejects(db.query("insert into reclamacoes_servico(solicitacao_id,motivo,descricao,criado_em) values($1,'qualidade','Relato suficientemente longo','2000-01-01')",[id(2)]),/permission denied/);
 await assert.rejects(responder(1),/row-level security/);
 await assert.rejects(db.query('select listar_reclamacoes_administrativas(0)'),/Área restrita/);
 await entrar(prof);assert.equal((await db.query('select * from reclamacoes_servico')).rows.length,1);await assert.rejects(criar(2),/row-level security/);
 await responder(1);await assert.rejects(responder(1),/unique constraint/);await assert.rejects(responder(2),/row-level security|foreign key/);
 await entrar(outro);assert.equal((await db.query('select * from reclamacoes_servico')).rows.length,0);assert.equal((await db.query('select * from respostas_reclamacao')).rows.length,0);
 await assert.rejects(criar(2),/row-level security/);await assert.rejects(responder(1),/row-level security/);await assert.rejects(db.query('select listar_reclamacoes_administrativas(0)'),/Área restrita/);
 await entrar(cliente,true);assert.equal((await db.query('select * from reclamacoes_servico')).rows.length,0);await assert.rejects(criar(2),/row-level security/);
 await entrar(null);await assert.rejects(criar(2),/row-level security|not-null/);
 for(const role of ['anon','service_role']){await entrar(cliente,false,role);await assert.rejects(db.query('select * from reclamacoes_servico'),/permission denied/);await assert.rejects(criar(2),/permission denied/);}
 await entrar(cliente);for(const tabela of ['reclamacoes_servico','respostas_reclamacao']){await assert.rejects(db.exec('update '+tabela+" set descricao='Texto alterado indevidamente'"),/permission denied/);await assert.rejects(db.exec('delete from '+tabela),/permission denied/);}
 await entrar(revisor);const fila=(await db.query('select listar_reclamacoes_administrativas(0) as fila')).rows[0].fila;assert.equal(fila.length,1);assert.equal(fila[0].solicitacao_id,id(1));assert.ok(fila[0].resposta);
 assert.equal((await db.query('select * from reclamacoes_servico')).rows.length,0,'revisor não ganha SELECT direto nos casos alheios');
 await assert.rejects(db.query('select listar_reclamacoes_administrativas(-1)'),/Página inválida/);
 await assert.rejects(db.query('select listar_reclamacoes_administrativas(10001)'),/Página inválida/);

 const op=n=>'99999999-0000-4000-8000-'+String(n).padStart(12,'0');
 const atualizar=(n,versao,status='em_analise',mensagem='Atendimento analisando o relato do cliente.')=>db.query('select atualizar_acompanhamento_reclamacao($1,$2,$3,$4,$5) as resultado',[id(1),op(n),versao,status,mensagem]);
 await assert.rejects(atualizar(1,0,'concluida'),/Transição inválida/);
 const primeira=(await atualizar(1,0)).rows[0].resultado;assert.equal(primeira.versao,1);
 assert.deepEqual((await atualizar(1,0)).rows[0].resultado,primeira,'reenvio da mesma operação é idempotente');
 await assert.rejects(atualizar(1,0,'em_analise','Mensagem diferente com o mesmo identificador.'),/Identificador já utilizado/);
 await assert.rejects(atualizar(2,0),/Caso atualizado/);
 await assert.rejects(atualizar(2,1,'em_analise','curto'),/Dados inválidos/);
 await atualizar(2,1,'concluida','Atendimento concluído; nenhuma devolução foi executada.');
 await assert.rejects(atualizar(3,2,'concluida'),/Transição inválida/);
 await atualizar(3,2,'em_analise','Caso reaberto para examinar a situação apresentada.');
 const historico=async(antes=2147483647)=>(await db.query('select consultar_acompanhamento_reclamacao($1,$2) as itens',[id(1),antes])).rows[0].itens;
 assert.deepEqual((await historico()).map(x=>x.versao),[3,2,1]);assert.deepEqual((await historico(2)).map(x=>x.versao),[1]);
 assert.equal((await db.query('select listar_reclamacoes_administrativas(0) as fila')).rows[0].fila[0].status,'em_analise');
 for(const u of [cliente,prof]){await entrar(u);assert.equal((await historico()).length,3);await assert.rejects(atualizar(4,3),/Área restrita/);}
 await entrar(outro);await assert.rejects(historico(),/Área restrita/);assert.equal((await db.query('select * from acompanhamento_reclamacoes')).rows.length,0);
 await entrar(cliente,true);await assert.rejects(historico(),/Área restrita/);
 await entrar(revisor);await assert.rejects(db.exec("insert into acompanhamento_reclamacoes default values"),/permission denied/);await assert.rejects(db.exec("update acompanhamento_reclamacoes set mensagem='Tentativa de alteração'"),/permission denied/);await assert.rejects(db.exec('delete from acompanhamento_reclamacoes'),/permission denied/);
 // Um revisor que participa do pedido pode consultar como parte, mas não decidir o próprio caso.
 await db.exec('reset role');await db.query('insert into private.revisores_perfil values($1,true)',[cliente]);await entrar(cliente);await assert.rejects(atualizar(4,3),/Caso indisponível/);await entrar(revisor);
 for(let n=4;n<=62;n++)await atualizar(n,n-1);
 assert.equal((await historico()).length,51);assert.equal((await historico())[0].versao,62);assert.equal((await historico(13)).length,12);
 for(const role of ['anon','service_role']){await entrar(revisor,false,role);await assert.rejects(historico(),/permission denied/);await assert.rejects(atualizar(63,62),/permission denied/);}
 await entrar(revisor);
 await db.exec('reset role');await db.query('update private.revisores_perfil set ativo=false where usuario_id=$1',[revisor]);await entrar(revisor);await assert.rejects(db.query('select listar_reclamacoes_administrativas(0)'),/Área restrita/);await assert.rejects(historico(),/Área restrita/);await assert.rejects(atualizar(4,3),/Área restrita/);
 await db.exec('reset role');assert.equal((await db.query('select status,valor_centavos from solicitacoes where id=$1',[id(1)])).rows[0].status,'concluida');
 assert.equal((await db.query('select valor_centavos from solicitacoes where id=$1',[id(1)])).rows[0].valor_centavos,10000);
 assert.equal((await db.query("select prosecdef from pg_proc where proname='listar_reclamacoes_administrativas'")).rows[0].prosecdef,false);
});
