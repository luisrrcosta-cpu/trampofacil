import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('pedido de nota: somente cliente registra; partes leem; sem emissão ou alteração financeira', async t => {
  const db=new PGlite();t.after(()=>db.close());
  const cliente='11111111-1111-4111-8111-111111111111';
  const profissional='22222222-2222-4222-8222-222222222222';
  const terceiro='33333333-3333-4333-8333-333333333333';
  const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
  await db.exec(`
    create role anon;create role authenticated;create role service_role;
    create schema auth;grant usage on schema auth to public;
    create table auth.users(id uuid primary key);
    create function auth.jwt() returns jsonb language sql stable as
      $$ select current_setting('request.jwt.claims',true)::jsonb $$;
    create function auth.uid() returns uuid language sql stable as
      $$ select (auth.jwt()->>'sub')::uuid $$;
    create table public.solicitacoes(id uuid primary key,cliente_usuario_id uuid,profissional_usuario_id uuid,status text,valor_centavos int);
    alter table public.solicitacoes enable row level security;
    grant select on public.solicitacoes to authenticated;
    create policy partes on public.solicitacoes for select to authenticated using
      ((select auth.uid()) in (cliente_usuario_id,profissional_usuario_id));
    insert into auth.users values('${cliente}'),('${profissional}'),('${terceiro}');
  `);
  const estados=['aceita','em_andamento','entregue','concluida','aceita','solicitada','cancelada','proposta'];
  for(let n=1;n<=estados.length;n++) await db.query('insert into solicitacoes values($1,$2,$3,$4,10000)',[id(n),cliente,profissional,estados[n-1]]);
  await db.exec(await readFile(new URL('../supabase/homologacao/pedidos_nota_fiscal.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/homologacao/atendimento_pedido_nota.sql',import.meta.url),'utf8'));
  const entrar=async(usuario,anonimo=false)=>{
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:usuario,is_anonymous:anonimo})]);
    await db.exec('set role authenticated');
  };
  await entrar(cliente);
  for(let n=1;n<=4;n++)await db.query('insert into pedidos_nota_fiscal(solicitacao_id) values($1)',[id(n)]);
  assert.equal((await db.query('select * from pedidos_nota_fiscal')).rows.length,4);
  await assert.rejects(db.query('insert into atendimentos_pedido_nota(solicitacao_id) values($1)',[id(1)]),/row-level security/);
  await assert.rejects(db.query('insert into pedidos_nota_fiscal(solicitacao_id) values($1)',[id(1)]),/unique constraint/);
  for(let n=6;n<=8;n++)await assert.rejects(db.query('insert into pedidos_nota_fiscal(solicitacao_id) values($1)',[id(n)]),/row-level security/);
  await assert.rejects(db.query('insert into pedidos_nota_fiscal(solicitacao_id,solicitante_usuario_id) values($1,$2)',[id(5),terceiro]),/permission denied/);
  await assert.rejects(db.query("insert into pedidos_nota_fiscal(solicitacao_id,estado) values($1,'emitida')",[id(5)]),/permission denied/);
  await assert.rejects(db.exec("update pedidos_nota_fiscal set estado='emitida'"),/permission denied/);
  await assert.rejects(db.exec('delete from pedidos_nota_fiscal'),/permission denied/);
  await db.exec('reset role');
  await db.query("update solicitacoes set status='cancelada' where id=$1",[id(1)]);
  await entrar(cliente);
  assert.equal((await db.query('select * from pedidos_nota_fiscal where solicitacao_id=$1',[id(1)])).rows.length,1,'cancelamento preserva consulta do pedido existente');
  await entrar(profissional);
  await db.query('insert into atendimentos_pedido_nota(solicitacao_id) values($1)',[id(1)]);
  await assert.rejects(db.query('insert into atendimentos_pedido_nota(solicitacao_id) values($1)',[id(1)]),/unique constraint/);
  await assert.rejects(db.query('insert into atendimentos_pedido_nota(solicitacao_id) values($1)',[id(5)]),/row-level security/);
  await assert.rejects(db.query('insert into atendimentos_pedido_nota(solicitacao_id,profissional_usuario_id) values($1,$2)',[id(2),cliente]),/permission denied/);
  await assert.rejects(db.exec('update atendimentos_pedido_nota set criado_em=now()'),/permission denied/);
  await assert.rejects(db.exec('delete from atendimentos_pedido_nota'),/permission denied/);
  assert.equal((await db.query('select * from atendimentos_pedido_nota')).rows.length,1);
  assert.equal((await db.query('select * from pedidos_nota_fiscal')).rows.length,4);
  await assert.rejects(db.query('insert into pedidos_nota_fiscal(solicitacao_id) values($1)',[id(5)]),/row-level security/);
  await entrar(cliente);
  assert.equal((await db.query('select * from atendimentos_pedido_nota')).rows.length,1);
  await entrar(terceiro);
  assert.equal((await db.query('select * from atendimentos_pedido_nota')).rows.length,0);
  assert.equal((await db.query('select * from pedidos_nota_fiscal')).rows.length,0);
  await assert.rejects(db.query('insert into pedidos_nota_fiscal(solicitacao_id) values($1)',[id(5)]),/row-level security/);
  await entrar(cliente,true);
  assert.equal((await db.query('select * from atendimentos_pedido_nota')).rows.length,0);
  assert.equal((await db.query('select * from pedidos_nota_fiscal')).rows.length,0);
  await assert.rejects(db.query('insert into pedidos_nota_fiscal(solicitacao_id) values($1)',[id(5)]),/row-level security/);
  await db.exec('reset role; set role anon');
  await assert.rejects(db.exec('select * from atendimentos_pedido_nota'),/permission denied/);
  await assert.rejects(db.exec('select * from pedidos_nota_fiscal'),/permission denied/);
  await db.exec('reset role');
  assert.equal((await db.query('select sum(valor_centavos)::int as total from solicitacoes')).rows[0].total,80000);
  assert.equal((await db.query("select count(*)::int as n from pedidos_nota_fiscal where estado='solicitada'")).rows[0].n,4);
});
