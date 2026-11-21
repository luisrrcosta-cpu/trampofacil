import test from 'node:test';
import assert from 'node:assert/strict';
import {validarConexaoBancoHomologacao, criarServidorEdgeHomologacao, urlHomologacao} from '../server/edge-homologacao.js';

test('recusa URLs de produção e URLs sem senha antes de abrir conexão',()=>{
  const proibidas=[
    'postgresql://postgres:senha@db.flropneedvaimzcmvcza.supabase.co:5432/postgres',
    'postgresql://postgres:senha@db.asdszqtpydiowgerxwee.supabase.co:5432/outro',
    'postgresql://postgres@db.asdszqtpydiowgerxwee.supabase.co:5432/postgres',
    'postgresql://postgres:senha@db.asdszqtpydiowgerxwee.supabase.co:5432/postgres?sslmode=disable',
    'https://db.asdszqtpydiowgerxwee.supabase.co/postgres'
  ];
  for(const url of proibidas) assert.throws(()=>validarConexaoBancoHomologacao(url));
});

test('aceita somente configuração direta de homologação com TLS',()=>{
  const c=validarConexaoBancoHomologacao('postgresql://postgres:senha@db.asdszqtpydiowgerxwee.supabase.co:5432/postgres');
  assert.equal(c.database,'postgres');
  assert.equal(c.username,'postgres');
  assert.equal(c.ssl.rejectUnauthorized,true);
  assert.equal(c.max,1);
  assert.equal(c.connection.lock_timeout,3000);
});

test('servidor Edge recusa projeto de produção antes de criar adaptadores',()=>{
  let abriu=false;
  assert.throws(()=>criarServidorEdgeHomologacao({
    supabaseUrl:'https://flropneedvaimzcmvcza.supabase.co',
    bancoUrl:'postgresql://postgres:senha@db.asdszqtpydiowgerxwee.supabase.co:5432/postgres',
    abrirBanco(){abriu=true;}
  }));
  assert.equal(abriu,false);
});

test('rota inexistente não abre banco nem ativa pagamentos',async()=>{
  let abriu=false;
  const handler=criarServidorEdgeHomologacao({
    supabaseUrl:urlHomologacao,
    bancoUrl:'postgresql://postgres:senha@db.asdszqtpydiowgerxwee.supabase.co:5432/postgres',
    abrirBanco(){abriu=true;throw new Error('não deveria abrir');},
    fetchImpl:async()=>{throw new Error('não deveria consultar');}
  });
  const resposta=await handler(new Request('https://exemplo.test/functions/v1/cobrar'));
  assert.equal(resposta.status,404);
  assert.equal((await resposta.json()).erro,'ROTA_INDISPONIVEL');
  assert.equal(abriu,false);
});

test('requisição GET não consulta Auth nem abre banco',async()=>{
  let chamadas=0;
  const handler=criarServidorEdgeHomologacao({
    supabaseUrl:urlHomologacao,
    bancoUrl:'postgresql://postgres:senha@db.asdszqtpydiowgerxwee.supabase.co:5432/postgres',
    abrirBanco(){chamadas++;throw new Error('acesso inesperado');},
    fetchImpl:async()=>{chamadas++;throw new Error('consulta inesperada');}
  });
  const resposta=await handler(new Request('https://exemplo.test/functions/v1/preparar-pagamento-teste',{method:'GET'}));
  assert.equal(resposta.status,405);
  assert.equal(chamadas,0);
});

test('origem não autorizada é rejeitada antes da autenticação',async()=>{
  let chamadas=0;
  const handler=criarServidorEdgeHomologacao({
    supabaseUrl:urlHomologacao,
    bancoUrl:'postgresql://postgres:senha@db.asdszqtpydiowgerxwee.supabase.co:5432/postgres',
    abrirBanco(){chamadas++;throw new Error('acesso inesperado');},
    fetchImpl:async()=>{chamadas++;throw new Error('consulta inesperada');}
  });
  const resposta=await handler(new Request('https://exemplo.test/functions/v1/preparar-pagamento-teste',{
    method:'POST',
    headers:{Origin:'https://site-nao-autorizado.example', 'Content-Type':'application/json'},
    body:'{}'
  }));
  assert.equal(resposta.status,403);
  assert.equal((await resposta.json()).erro,'ORIGEM_NAO_PERMITIDA');
  assert.equal(chamadas,0);
});

test('POST sem autenticação não abre banco nem consulta serviço externo',async()=>{
  let chamadas=0;
  const handler=criarServidorEdgeHomologacao({
    supabaseUrl:urlHomologacao,
    bancoUrl:'postgresql://postgres:senha@db.asdszqtpydiowgerxwee.supabase.co:5432/postgres',
    abrirBanco(){chamadas++;throw new Error('acesso inesperado');},
    fetchImpl:async()=>{chamadas++;throw new Error('consulta inesperada');}
  });
  const resposta=await handler(new Request('https://exemplo.test/functions/v1/preparar-pagamento-teste',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({solicitacaoId:'11111111-1111-4111-8111-111111111111',forma:'credito_avista',parcelas:1})
  }));
  assert.equal(resposta.status,401);
  assert.equal((await resposta.json()).erro,'NAO_AUTENTICADO');
  assert.equal(chamadas,0);
});

test('token falso não permite abrir banco financeiro',async()=>{
  let abriu=0,consultas=0;
  const handler=criarServidorEdgeHomologacao({
    supabaseUrl:urlHomologacao,
    bancoUrl:'postgresql://postgres:senha@db.asdszqtpydiowgerxwee.supabase.co:5432/postgres',
    abrirBanco(){abriu++;throw new Error('acesso inesperado');},
    fetchImpl:async()=>{consultas++;return new Response(JSON.stringify({message:'invalid JWT'}),{status:401,headers:{'Content-Type':'application/json'}});}
  });
  const resposta=await handler(new Request('https://exemplo.test/functions/v1/preparar-pagamento-teste',{
    method:'POST',
    headers:{'Content-Type':'application/json',Authorization:'Bearer token.falso.assinatura'},
    body:JSON.stringify({solicitacaoId:'11111111-1111-4111-8111-111111111111',forma:'credito_avista',parcelas:1})
  }));
  assert.equal(resposta.status,401);
  assert.equal((await resposta.json()).erro,'NAO_AUTENTICADO');
  assert.equal(consultas,1);
  assert.equal(abriu,0);
});

test('corpo excessivo é bloqueado antes de consultar Auth ou banco',async()=>{
  let consultas=0;
  const handler=criarServidorEdgeHomologacao({
    supabaseUrl:urlHomologacao,
    bancoUrl:'postgresql://postgres:senha@db.asdszqtpydiowgerxwee.supabase.co:5432/postgres',
    abrirBanco(){consultas++;throw new Error('banco não deve abrir');},
    fetchImpl:async()=>{consultas++;throw new Error('Auth não deve ser consultado');}
  });
  const resposta=await handler(new Request('https://exemplo.test/functions/v1/preparar-pagamento-teste',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({dados:'x'.repeat(5000)})
  }));
  assert.equal(resposta.status,413);
  assert.equal((await resposta.json()).erro,'CORPO_MUITO_GRANDE');
  assert.equal(consultas,0);
});
