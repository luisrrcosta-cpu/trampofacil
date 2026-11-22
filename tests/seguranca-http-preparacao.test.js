import test from 'node:test';
import assert from 'node:assert/strict';
import {criarHandlerPreparacao} from '../server/handler-preparacao.js';
import {ErroPreparacaoPagamento} from '../server/preparar-pagamento.js';
const origem='https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site';
const url='https://example.invalid/api/pagamentos/preparar';
const corpo=JSON.stringify({solicitacaoId:'00000000-0000-4000-8000-000000000003',forma:'credito_avista',parcelas:1});
function montar(){let chamadas=0;const handler=criarHandlerPreparacao({origemPermitida:origem,preparador:{async preparar(){chamadas++;throw new ErroPreparacaoPagamento('NAO_AUTENTICADO',401,'Sessão necessária.');}}});return {handler,chamadas:()=>chamadas};}
const requisicao=(opcoes={})=>new Request(url,{method:'POST',headers:{'Content-Type':'application/json',...(opcoes.headers||{})},body:opcoes.body??corpo});
test('origem externa bloqueada antes de chamar preparador',async()=>{const s=montar();const r=await s.handler(requisicao({headers:{Origin:'https://malicioso.invalid'}}));assert.equal(r.status,403);assert.equal(s.chamadas(),0);assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);});
test('POST sem autenticação retorna 401 sem dados financeiros',async()=>{const s=montar();const r=await s.handler(requisicao());assert.equal(r.status,401);assert.deepEqual((await r.json()).erro,'NAO_AUTENTICADO');assert.equal(s.chamadas(),1);});
test('método GET bloqueado antes de chamar preparador',async()=>{const s=montar();const r=await s.handler(new Request(url));assert.equal(r.status,405);assert.equal(s.chamadas(),0);});
test('corpo acima de 4096 bytes bloqueado antes de chamar preparador',async()=>{const s=montar();const r=await s.handler(requisicao({body:' '.repeat(4097)}));assert.equal(r.status,413);assert.equal(s.chamadas(),0);});
test('JSON inválido bloqueado antes de chamar preparador',async()=>{const s=montar();const r=await s.handler(requisicao({body:'{invalid'}));assert.equal(r.status,400);assert.equal(s.chamadas(),0);});
test('OPTIONS somente origem permitida sem consultar preparador',async()=>{const s=montar();const r=await s.handler(new Request(url,{method:'OPTIONS',headers:{Origin:origem}}));assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),origem);assert.equal(s.chamadas(),0);});
