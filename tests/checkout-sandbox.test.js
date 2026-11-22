import test,{before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {criarCheckoutPagBankSandbox,validarUrlCheckoutSandbox} from '../server/checkout-pagbank-sandbox.js';
import {criarOrquestradorCheckoutSandbox} from '../server/checkout-orquestrador-sandbox.js';
const cliente='11111111-1111-4111-8111-111111111111',prof='22222222-2222-4222-8222-222222222222',pedido='33333333-3333-4333-8333-333333333333',prep='44444444-4444-4444-8444-444444444444';
const url='https://qa.pagamento.pagseguro.uol.com.br/pagamento?code=ficticio';
let db;
before(async()=>{
 db=new PGlite();await db.exec(`create schema private;create schema auth;
 create role anon;create role authenticated;create role service_role bypassrls;
 create table auth.users(id uuid primary key);
 create table public.solicitacoes(id uuid primary key,cliente_usuario_id uuid,profissional_usuario_id uuid,status text,valor_centavos integer,atualizado_em timestamptz);
 grant select,update on public.solicitacoes to service_role;
 insert into auth.users values ('${cliente}'),('${prof}');`);
 await db.exec(await readFile(new URL('../supabase/migrations/20261119120537_registrar_preparacao_pagamento_teste.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../supabase/homologacao/checkout-pagbank-sandbox.sql',import.meta.url),'utf8'));
});
after(async()=>db?.close());
beforeEach(async()=>{
 await db.exec('truncate private.checkouts_pagbank_sandbox,private.preparacoes_pagamento,public.solicitacoes');
 await db.query("insert into public.solicitacoes values($1,$2,$3,'aceita',10000,now())",[pedido,cliente,prof]);
 await db.query(`insert into private.preparacoes_pagamento(id,solicitacao_id,cliente_usuario_id,profissional_usuario_id,versao_orcamento,valor_servico_centavos,comissao_centavos,profissional_centavos,forma,parcelas)
 select $1,id,cliente_usuario_id,profissional_usuario_id,atualizado_em,10000,1000,9000,'credito_avista',1 from public.solicitacoes`,[prep]);
});
const iniciar=(p=prep,u=cliente)=>db.transaction(async t=>{await t.exec('set local role service_role');return (await t.query('select private.iniciar_checkout_sandbox($1,$2) as c',[p,u])).rows[0].c;});
const finalizar=(id,checkoutId='CHEC_ficticio',u=url)=>db.transaction(async t=>{await t.exec('set local role service_role');return (await t.query('select private.finalizar_checkout_sandbox($1,$2,$3) as estado',[id,checkoutId,u])).rows[0].estado;});
test('claim persistido permite somente um envio e reutiliza checkout confirmado',async()=>{
 const a=await iniciar(),b=await iniciar();assert.equal(a.novo,true);assert.equal(b.novo,false);assert.equal(a.id,b.id);assert.equal(a.valorCentavos,10000);
 assert.equal(await finalizar(a.id),'criado');const c=await iniciar();assert.equal(c.url,url);assert.equal(c.novo,false);
 assert.equal((await db.query('select pagamento_real_habilitado,repasse_habilitado from private.checkouts_pagbank_sandbox')).rows[0].pagamento_real_habilitado,false);
});
test('cliente errado, versão, preço, situação e parcelamento divergentes são bloqueados',async()=>{
 await assert.rejects(iniciar(prep,prof));
 for(const sql of ["update public.solicitacoes set status='cancelada'","update public.solicitacoes set valor_centavos=20000","update public.solicitacoes set atualizado_em=atualizado_em+interval '1 second'"]){
  await db.exec("update public.solicitacoes set status='aceita',valor_centavos=10000,atualizado_em=(select versao_orcamento from private.preparacoes_pagamento limit 1)");
  await db.exec(sql);await assert.rejects(iniciar());
 }
 await db.exec("update public.solicitacoes set status='aceita',valor_centavos=10000,atualizado_em=(select versao_orcamento from private.preparacoes_pagamento limit 1)");
 await db.exec("update private.preparacoes_pagamento set forma='credito_parcelado',parcelas=2");await assert.rejects(iniciar());
});
test('incerteza não volta a autorizar envio e cancelamento durante rede bloqueia link',async()=>{
 const a=await iniciar();assert.equal(await finalizar(a.id,null,null),'incerto');assert.equal((await iniciar()).novo,false);
 await db.exec('truncate private.checkouts_pagbank_sandbox');const b=await iniciar();
 await db.exec("update public.solicitacoes set status='cancelada'");
 assert.equal(await finalizar(b.id),'bloqueado');await assert.rejects(iniciar());
});
test('clientes não acessam funções privadas ou registros e links externos são recusados',async()=>{
 const a=await iniciar();await assert.rejects(finalizar(a.id,'CHEC_ficticio','https://pagamento.pagbank.com.br/pagamento?code=real'));
 for(const role of ['anon','authenticated'])await assert.rejects(db.transaction(async t=>{await t.exec('set local role '+role);await t.query('select private.iniciar_checkout_sandbox($1,$2)',[prep,cliente]);}));
});
test('adaptador envia somente campos controlados para sandbox, sem dados pessoais',async()=>{
 const c=await iniciar();let chamadas=0;
 const api=criarCheckoutPagBankSandbox({ambiente:'sandbox',token:'ficticio',fetchImpl:async(u,op)=>{
  chamadas++;assert.equal(u,'https://sandbox.api.pagseguro.com/checkouts');assert.equal(op.method,'POST');assert.equal(op.redirect,'error');
  const d=JSON.parse(op.body);assert.equal(d.items[0].unit_amount,10000);assert.equal(d.customer,undefined);assert.equal(d.recurrence_plan,undefined);assert.equal(d.additional_amount,undefined);assert.equal(d.payment_methods_configs[0].config_options[0].value,'1');
  return Response.json({id:'CHEC_ficticio',status:'ACTIVE',reference_id:c.referencia,items:[{unit_amount:10000,quantity:1}],links:[{rel:'PAY',href:url}]});
 }});
 assert.deepEqual(await api.criar(c),{checkoutId:'CHEC_ficticio',url});assert.equal(chamadas,1);
 assert.throws(()=>criarCheckoutPagBankSandbox({ambiente:'producao',token:'ficticio'}));
});
test('falha de rede, referências e links não confiáveis não repetem POST nem propagam resposta',async()=>{
 const c=await iniciar();let n=0;
 const api=criarCheckoutPagBankSandbox({ambiente:'sandbox',token:'ficticio',fetchImpl:async()=>{n++;throw Error('segredo')}});
 await assert.rejects(api.criar(c),e=>!e.message.includes('segredo'));assert.equal(n,1);
 for(const v of ['https://externo.invalid/pagamento?code=x','https://qa.pagamento.pagseguro.uol.com.br.evil.invalid/pagamento?code=x','https://qa.pagamento.pagseguro.uol.com.br/pagamento?code=x&next=x','http://qa.pagamento.pagseguro.uol.com.br/pagamento?code=x'])assert.equal(validarUrlCheckoutSandbox(v),false);
});
test('orquestrador valida identidade e não reenvia após resultado incerto',async()=>{
 let posts=0;
 const o=criarOrquestradorCheckoutSandbox({ambiente:'sandbox',autenticar:async()=>({id:cliente,isAnonymous:false}),iniciar:({preparacaoId,usuarioId})=>iniciar(preparacaoId,usuarioId),finalizar:({id,checkoutId,url})=>finalizar(id,checkoutId,url),criarCheckout:async()=>{posts++;throw Error();}});
 const dados={authorization:'Bearer ficticio',body:{preparacaoId:prep}};
 await assert.rejects(o.preparar({...dados,body:{preparacaoId:prep,valor:1}}),e=>e.status===400);
 await assert.rejects(o.preparar({...dados,authorization:undefined}),e=>e.status===401);
 await assert.rejects(o.preparar(dados),e=>e.status===503);
 await assert.rejects(o.preparar(dados),e=>e.status===409);assert.equal(posts,1);
});
test('orquestrador retorna link salvo e bloqueia checkout expirado',async()=>{
 const c=await iniciar();await finalizar(c.id);let posts=0;
 const montar=agora=>criarOrquestradorCheckoutSandbox({ambiente:'sandbox',agora,autenticar:async()=>({id:cliente,isAnonymous:false}),iniciar:({preparacaoId,usuarioId})=>iniciar(preparacaoId,usuarioId),finalizar,criarCheckout:async()=>{posts++;}});
 const d={authorization:'Bearer ficticio',body:{preparacaoId:prep}};
 assert.equal((await montar(Date.now).preparar(d)).url,url);
 await assert.rejects(montar(()=>Date.parse(c.criadoEm)+900001).preparar(d),e=>e.status===409);assert.equal(posts,0);
});
