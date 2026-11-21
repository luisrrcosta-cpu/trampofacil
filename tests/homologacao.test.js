import assert from 'node:assert/strict';
import test from 'node:test';
import {criarAdaptadoresHomologacao} from '../server/supabase-homologacao.js';
import {criarPreparadorPagamento} from '../server/preparar-pagamento.js';
import {criarHandlerPreparacao} from '../server/handler-preparacao.js';
const cliente='11111111-1111-4111-8111-111111111111',profissional='22222222-2222-4222-8222-222222222222',id='44444444-4444-4444-8444-444444444444';
const origem='https://homologacao.example.invalid';
const config={ambiente:'teste',projetoHomologacaoConfirmado:true,supabaseUrl:'https://asdszqtpydiowgerxwee.supabase.co',chavePublicavel:'sb_publishable_ficticia'};
const pedido={id,cliente_usuario_id:cliente,profissional_usuario_id:profissional,status:'aceita',valor_centavos:10000,atualizado_em:'2026-11-19T12:00:00Z'};
const dados={solicitacaoId:id,forma:'credito_avista',parcelas:1};
const requisicao=(body=JSON.stringify(dados),extras={})=>new Request(origem+'/api/pagamentos/preparar',{
  method:'POST',headers:{Origin:origem,Authorization:'Bearer token-ficticio','Content-Type':'application/json',...extras.headers},body,...Object.fromEntries(Object.entries(extras).filter(([k])=>k!=='headers')),
});
function montar(opcoes={}){
 const chamadas=[];
 const fetchImpl=opcoes.fetchImpl|| (async(url,init)=>{
   chamadas.push({url,init});
   return new Response(JSON.stringify(url.endsWith('/auth/v1/user')?{id:cliente,is_anonymous:false,email_confirmed_at:'2026-11-19T10:00:00Z'}:[pedido]),{status:200});
 });
 const adaptadores=criarAdaptadoresHomologacao({...config,fetchImpl});
 const preparador=criarPreparadorPagamento({ambiente:'teste',...adaptadores});
 return {chamadas,handle:criarHandlerPreparacao({preparador,origemPermitida:origem,...opcoes.handler}),adaptadores};
}

test('handler valida a identidade no Auth e lê o orçamento via JWT/RLS, sem gravar',async()=>{
 const {handle,chamadas}=montar();const resposta=await handle(requisicao());const body=await resposta.json();
 assert.equal(resposta.status,200);assert.equal(body.comissaoCentavos,1000);assert.equal(body.pagamentoHabilitado,false);
 assert.equal(resposta.headers.get('Cache-Control'),'no-store');assert.equal(resposta.headers.get('Access-Control-Allow-Origin'),origem);
 assert.equal(chamadas.length,2);
 for(const {url,init} of chamadas){assert.match(url,/^https:\/\/asdszqtpydiowgerxwee\.supabase\.co\//);assert.equal(init.method,'GET');assert.equal(init.headers.Authorization,'Bearer token-ficticio');assert.equal(init.redirect,'error');assert.equal(init.credentials,'omit');assert.equal(init.cache,'no-store');}
 const query=new URL(chamadas[1].url).searchParams;
 assert.equal(query.get('cliente_usuario_id'),'eq.'+cliente);assert.equal(query.get('id'),'eq.'+id);
 assert.ok(!query.get('select').includes('telefone'));assert.ok(!JSON.stringify(body).includes('token-ficticio'));
});
test('configuração rejeita produção, chaves administrativas e destinos não autorizados',()=>{
 for(const alteracao of [
  {ambiente:'producao'},{projetoHomologacaoConfirmado:false},{supabaseUrl:'https://flropneedvaimzcmvcza.supabase.co'},{supabaseUrl:'https://abcdefghijklmnopqrst.supabase.co'},
  {supabaseUrl:'https://asdszqtpydiowgerxwee.supabase.co.evil.invalid'},{supabaseUrl:'http://asdszqtpydiowgerxwee.supabase.co'},
  {supabaseUrl:'https://asdszqtpydiowgerxwee.supabase.co/rest/v1'},{supabaseUrl:'https://usuario:senha@asdszqtpydiowgerxwee.supabase.co'},
  {chavePublicavel:'sb_secret_nao_permitida'},{chavePublicavel:'eyJservice_role'},
 ])assert.throws(()=>criarAdaptadoresHomologacao({...config,...alteracao}));
});
test('token recusado não chega à consulta do orçamento nem revela o erro do Auth',async()=>{
 let chamadas=0;const {handle}=montar({fetchImpl:async()=>{chamadas++;return new Response(JSON.stringify({erro:'detalhe privado'}),{status:401});}});
 const resposta=await handle(requisicao());assert.equal(resposta.status,401);assert.equal(chamadas,1);
 assert.ok(!(await resposta.text()).includes('detalhe privado'));
});
test('usuário anônimo ou e-mail não confirmado é recusado pelo adaptador',async()=>{
 for(const usuario of [{id:cliente,is_anonymous:true,email_confirmed_at:'2026-11-19'},{id:cliente,is_anonymous:false},{id:cliente,email_confirmed_at:'2026-11-19'}]){
  const {handle}=montar({fetchImpl:async()=>new Response(JSON.stringify(usuario))});
  assert.equal((await handle(requisicao())).status,401);
 }
});
test('identidades malformadas não chegam à leitura de solicitações',async()=>{
 for(const usuario of [
  {id:'nao-e-uuid',is_anonymous:false,email_confirmed_at:'2026-11-19'},
  {id:profissional+'-extra',is_anonymous:false,email_confirmed_at:'2026-11-19'},
  {id:cliente,is_anonymous:'false',email_confirmed_at:'2026-11-19'},
  {id:cliente,is_anonymous:false,email_confirmed_at:null},
 ]){
  let chamadas=0;
  const {handle}=montar({fetchImpl:async()=>{chamadas++;return new Response(JSON.stringify(usuario));}});
  const resposta=await handle(requisicao());
  assert.equal(resposta.status,401);
  assert.equal(chamadas,1,'identidade inválida não pode consultar solicitações');
 }
});
test('consulta vazia e pedido de outro cliente não revelam dados',async()=>{
 for(const registros of [[],[{...pedido,cliente_usuario_id:profissional}]]){
  const {handle}=montar({fetchImpl:async(url)=>new Response(JSON.stringify(url.endsWith('/auth/v1/user')?{id:cliente,is_anonymous:false,email_confirmed_at:'2026-11-19'}:registros))});
  const r=await handle(requisicao());assert.equal(r.status,404);assert.ok(!(await r.text()).includes('10000'));
 }
});
test('CORS, tipo e tamanho do corpo são conferidos antes de consultar o Auth',async()=>{
 const {handle,chamadas}=montar();
 assert.equal((await handle(requisicao(undefined,{headers:{Origin:'https://outra.example.invalid'}}))).status,403);
 assert.equal((await handle(requisicao('{}',{headers:{'Content-Type':'text/plain'}}))).status,415);
 assert.equal((await handle(requisicao('{'))).status,400);
 assert.equal((await handle(requisicao('x'.repeat(4097)))).status,413);
 assert.equal((await handle(requisicao('ç'.repeat(2050),{headers:{'Content-Length':'1'}}))).status,413);
 assert.equal(chamadas.length,0);
});
test('formatos JSON incorretos são rejeitados',async()=>{
 const corpos=['null','[]','"texto"','true','{"solicitacaoId":'];
 for(const corpo of corpos){
  const {handle,chamadas}=montar();
  const resposta=await handle(requisicao(corpo));
  assert.equal(resposta.status,400);
  assert.equal(chamadas.length,corpo.endsWith(':')?0:1);
 }
});

test('JSON com UTF-8 inválido é recusado antes de autenticar',async()=>{
 const {handle,chamadas}=montar();
 const req=new Request(origem+'/api/pagamentos/preparar',{
  method:'POST',headers:{Origin:origem,Authorization:'Bearer token-ficticio','Content-Type':'application/json'},
  body:new Uint8Array([0xc3,0x28]),
 });
 const resposta=await handle(req);
 assert.equal(resposta.status,400);
 assert.equal(chamadas.length,0,'JSON inválido não pode chegar ao Auth');
});
test('rotas de cobrança e métodos de gravação adicionais não existem',async()=>{
 const {handle,chamadas}=montar();
 for(const metodo of ['GET','PUT','PATCH','DELETE']){
  const req=new Request(origem+'/api/pagamentos/preparar',{method:metodo});assert.equal((await handle(req)).status,405);
 }
 assert.equal((await handle(new Request(origem+'/api/pagamentos/cobrar',{method:'POST'}))).status,404);
 const preflight=await handle(new Request(origem+'/api/pagamentos/preparar',{method:'OPTIONS',headers:{Origin:origem}}));
 assert.equal(preflight.status,204);assert.equal(chamadas.length,0);
});
test('leitura de corpo interrompida tem prazo e não chega ao Auth',async()=>{
 let cancelado=false;const body=new ReadableStream({cancel(){cancelado=true;}});
 const {handle,chamadas}=montar({handler:{timeoutCorpoMs:10}});
 const req=requisicao(body,{duplex:'half'});const r=await handle(req);
 assert.equal(r.status,408);assert.equal(chamadas.length,0);assert.equal(cancelado,true);
});
test('campos de valor injetados continuam recusados no fluxo completo',async()=>{
 const {handle,chamadas}=montar();const r=await handle(requisicao(JSON.stringify({...dados,valor_centavos:1})));
 assert.equal(r.status,400);assert.equal(chamadas.length,1);
});
