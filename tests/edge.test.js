import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test, {before, after, beforeEach} from 'node:test';
import {PGlite} from '@electric-sql/pglite';
import {criarServidorEdgeHomologacao, validarConexaoBancoHomologacao, urlHomologacao, origemInterfaceHomologacao} from '../server/edge-homologacao.js';

const cliente='11111111-1111-4111-8111-111111111111';
const profissional='22222222-2222-4222-8222-222222222222';
const pedidoId='44444444-4444-4444-8444-444444444444';
const pedido={id:pedidoId, cliente_usuario_id:cliente, profissional_usuario_id:profissional,
  status:'aceita', valor_centavos:10000, atualizado_em:'2026-11-19T12:00:00.123456Z'};
const bancoUrl='postgresql://postgres:credencial-ficticia@db.asdszqtpydiowgerxwee.supabase.co:5432/postgres';
const corpo={solicitacaoId:pedidoId,forma:'credito_parcelado',parcelas:10};
const requisicao=(extras={})=>new Request(urlHomologacao+'/functions/v1/preparar-pagamento-teste',{
  method:'POST',headers:{Authorization:'Bearer token-ficticio','Content-Type':'application/json'},
  body:JSON.stringify(corpo),...extras,
});
let db;
before(async()=>{
  db=new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema private;
    create table auth.users(id uuid primary key);
    create table public.solicitacoes(id uuid primary key,cliente_usuario_id uuid,
      profissional_usuario_id uuid,status text,valor_centavos integer,atualizado_em timestamptz);
    grant select,update on public.solicitacoes to service_role;
    insert into auth.users values ('${cliente}'),('${profissional}');
  `);
  const pasta=new URL('../supabase/migrations/',import.meta.url);
  for(const sufixo of ['_registrar_preparacao_pagamento_teste.sql','_negar_acesso_publico_preparacoes.sql']) {
    const arquivo=(await readdir(pasta)).find(n=>n.endsWith(sufixo));
    await db.exec(await readFile(new URL(arquivo,pasta),'utf8'));
  }
});
after(async()=>db?.close());
beforeEach(async()=>{
  await db.exec('truncate private.preparacoes_pagamento, public.solicitacoes');
  await db.query('insert into public.solicitacoes values ($1,$2,$3,$4,$5,$6)',
    [pedidoId,cliente,profissional,'aceita',10000,pedido.atualizado_em]);
});

function montar({fetchImpl, perderResposta=false, conexao=bancoUrl}={}) {
  const chamadas={auth:0,abertura:0,transacoes:0};
  const fetchPadrao=async(url,init)=>{
    assert.equal(init.headers.Authorization,'Bearer token-ficticio');
    if(url.endsWith('/auth/v1/user')) {
      chamadas.auth++;
      return Response.json({id:cliente,is_anonymous:false,email_confirmed_at:'2026-11-19T10:00:00Z'});
    }
    assert.ok(url.startsWith(urlHomologacao+'/rest/v1/solicitacoes?'));
    return Response.json([pedido]);
  };
  const abrirBanco=opcoes=>{
    chamadas.abertura++;
    assert.equal(opcoes.host,'db.asdszqtpydiowgerxwee.supabase.co');
    assert.equal(opcoes.ssl.rejectUnauthorized,true);
    assert.equal(opcoes.prepare,false);
    return {begin:async executar=>{
      chamadas.transacoes++;
      const resultado=await db.transaction(async transacao=>{
        const tag=async(partes,...valores)=>{
          const texto=partes.reduce((a,p,i)=>a+(i?'$'+i:'')+p,'');
          return (await transacao.query(texto,valores)).rows;
        };
        return executar(tag);
      });
      if(perderResposta) {perderResposta=false;throw new Error('resposta de teste perdida após commit');}
      return resultado;
    }};
  };
  return {chamadas,handle:criarServidorEdgeHomologacao({supabaseUrl:urlHomologacao,bancoUrl:conexao,abrirBanco,fetchImpl:fetchImpl||fetchPadrao})};
}

test('serviço Edge integrado usa Auth, versão salva e transação SQL para reutilizar preparação',async()=>{
  const {handle,chamadas}=montar();
  const a=await handle(requisicao()); const ra=await a.json();
  const b=await handle(requisicao()); const rb=await b.json();
  assert.equal(a.status,200); assert.equal(b.status,200);
  assert.equal(ra.preparacaoId,rb.preparacaoId);
  assert.equal(ra.preparacaoRegistrada,true); assert.equal(ra.pagamentoHabilitado,false);
  assert.equal(ra.comissaoCentavos,1000); assert.equal(ra.profissionalCentavos,9000);
  assert.equal(chamadas.auth,2); assert.equal(chamadas.abertura,1);
  assert.equal((await db.query('select count(*)::int as n from private.preparacoes_pagamento')).rows[0].n,1);
});
test('resposta perdida após commit não duplica a preparação quando a mesma chamada é repetida',async()=>{
  const {handle}=montar({perderResposta:true});
  assert.equal((await handle(requisicao())).status,503);
  const id=(await db.query('select id from private.preparacoes_pagamento')).rows[0].id;
  const resposta=await handle(requisicao());
  assert.equal(resposta.status,200);assert.equal((await resposta.json()).preparacaoId,id);
  assert.equal((await db.query('select count(*)::int as n from private.preparacoes_pagamento')).rows[0].n,1);
});
test('alteração no banco após consulta da API é detectada atomicamente antes de registrar',async()=>{
  const {handle}=montar();
  await db.exec("update public.solicitacoes set status='cancelada'");
  const resposta=await handle(requisicao());
  assert.equal(resposta.status,409);assert.equal((await resposta.json()).erro,'PREPARACAO_DIVERGENTE');
  assert.equal((await db.query('select count(*)::int as n from private.preparacoes_pagamento')).rows[0].n,0);
});
test('sem token ou com token recusado não abre banco e não revela erro de autenticação',async()=>{
  const {handle,chamadas}=montar({fetchImpl:async()=>Response.json({erro:'detalhes privados'},{status:401})});
  assert.equal((await handle(requisicao({headers:{'Content-Type':'application/json'}}))).status,401);
  const resposta=await handle(requisicao());
  assert.equal(resposta.status,401);assert.ok(!(await resposta.text()).includes('detalhes privados'));
  assert.equal(chamadas.abertura,0);
});
test('rotas, métodos e origens externos são recusados antes de autenticar ou abrir banco',async()=>{
  const {handle,chamadas}=montar();
  assert.equal((await handle(new Request(urlHomologacao+'/functions/v1/preparar-pagamento-teste/cobrar'))).status,404);
  assert.equal((await handle(new Request(urlHomologacao+'/functions/v1/preparar-pagamento-teste?token=nao-usar'))).status,404);
  assert.equal((await handle(new Request(urlHomologacao+'/functions/v1/preparar-pagamento-teste'))).status,405);
  assert.equal((await handle(requisicao({headers:{Origin:'https://externo.example.invalid','Content-Type':'application/json'}}))).status,403);
  const preflight=await handle(new Request(urlHomologacao+'/functions/v1/preparar-pagamento-teste',{
    method:'OPTIONS',headers:{Origin:origemInterfaceHomologacao},
  }));
  assert.equal(preflight.status,204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),origemInterfaceHomologacao);
  assert.ok(preflight.headers.get('Access-Control-Allow-Headers').includes('apikey'));
  assert.equal(chamadas.auth,0);assert.equal(chamadas.abertura,0);
});
test('configuração recusa banco de produção, hosts externos, parâmetros e TLS desativado',()=>{
  for(const valor of [undefined,'postgresql://postgres:ficticia@db.flropneedvaimzcmvcza.supabase.co/postgres',
    bancoUrl.replace('db.asdszqtpydiowgerxwee.supabase.co','externo.example.invalid'),
    bancoUrl+'?sslmode=disable',bancoUrl+'?sslmode=allow',bancoUrl+'?sslmode=require&sslmode=disable',bancoUrl+'?options=unsafe',bancoUrl.replace('/postgres','/outro'),bancoUrl.replace(':5432',':8000')]) {
    assert.throws(()=>validarConexaoBancoHomologacao(valor));
  }
  assert.throws(()=>criarServidorEdgeHomologacao({supabaseUrl:'https://flropneedvaimzcmvcza.supabase.co',abrirBanco:()=>{}}));
  const pool=validarConexaoBancoHomologacao('postgresql://postgres.asdszqtpydiowgerxwee:ficticia@aws-1-sa-east-1.pooler.supabase.com:6543/postgres');
  for (const modo of ['prefer','require','verify-full']) {
    assert.deepEqual(validarConexaoBancoHomologacao(bancoUrl+'?sslmode='+modo).ssl, {rejectUnauthorized:true});
  }
  assert.equal(pool.ssl.rejectUnauthorized,true);
});
test('conexão de banco inválida falha fechada sem expor credencial ou tentar abrir conexão',async()=>{
  const {handle,chamadas}=montar({conexao:'postgresql://postgres:ficticia-sensivel@externo.example.invalid/postgres'});
  const resposta=await handle(requisicao());
  assert.equal(resposta.status,503);assert.ok(!(await resposta.text()).includes('ficticia-sensivel'));
  assert.equal(chamadas.abertura,0);
});
