import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {criarConsultaEstadoCheckout} from '../server/estado-checkout-sandbox.js';
import {criarLeituraEstadoCheckout} from '../server/estado-checkout-banco.js';
import {criarHandlerPreparacao} from '../server/handler-preparacao.js';
const usuario='11111111-1111-4111-8111-111111111111',outro='22222222-2222-4222-8222-222222222222',id='33333333-3333-4333-8333-333333333333';
const body={preparacaoId:id},authorization='Bearer ficticio';
const registro=estado=>({preparacao_id:id,cliente_usuario_id:usuario,estado,pagamento_real_habilitado:false,repasse_habilitado:false});
test('consulta autentica no servidor, valida titular e devolve apenas estado sem autorização financeira',async()=>{
 for(const estado of ['nao_iniciado','envio_iniciado','incerto','criado','bloqueado']){
  let n=0;const c=criarConsultaEstadoCheckout({ambiente:'sandbox',autenticar:async t=>{assert.equal(t,'ficticio');return {id:usuario,isAnonymous:false};},consultar:async d=>{n++;assert.deepEqual(d,{preparacaoId:id,usuarioId:usuario});return {...registro(estado),segredo:'nao-retornar'};}});
  const r=await c.preparar({authorization,body});assert.deepEqual(r,{preparacaoId:id,estado,ambiente:'sandbox',pagamentoConfirmado:false,liberarRepasse:false});assert.equal(n,1);assert.equal(Object.isFrozen(r),true);
 }
});
test('sem sessão, anônimo, corpo inválido e falha de Auth não consultam banco',async()=>{
 let n=0;
 for(const u of [null,{id:usuario,isAnonymous:true}]){
  const c=criarConsultaEstadoCheckout({ambiente:'sandbox',autenticar:async()=>u,consultar:async()=>{n++;}});
  await assert.rejects(c.preparar({authorization,body}),e=>e.status===401);
 }
 const c=criarConsultaEstadoCheckout({ambiente:'sandbox',autenticar:async()=>({id:usuario,isAnonymous:false}),consultar:async()=>{n++;}});
 await assert.rejects(c.preparar({body}),e=>e.status===401);
 for(const b of [null,[],{preparacaoId:id,usuarioId:outro},{preparacaoId:'invalido'}])await assert.rejects(c.preparar({authorization,body:b}),e=>e.status===400);
 assert.equal(n,0);assert.throws(()=>criarConsultaEstadoCheckout({ambiente:'producao',autenticar(){},consultar(){}}));
});
test('ausente e outro titular retornam mesmo 404; corrupção/falha falha fechada sem detalhes',async()=>{
 for(const r of [null,{...registro('incerto'),cliente_usuario_id:outro},{...registro('incerto'),preparacao_id:outro}]){
  const c=criarConsultaEstadoCheckout({ambiente:'sandbox',autenticar:async()=>({id:usuario,isAnonymous:false}),consultar:async()=>r});
  await assert.rejects(c.preparar({authorization,body}),e=>e.status===404&&e.codigo==='TENTATIVA_INDISPONIVEL');
 }
 for(const consultar of [async()=>({...registro('PAID')}),async()=>({...registro('incerto'),repasse_habilitado:true}),async()=>{throw Error('senha privada')}]){
  const c=criarConsultaEstadoCheckout({ambiente:'sandbox',autenticar:async()=>({id:usuario,isAnonymous:false}),consultar});
  await assert.rejects(c.preparar({authorization,body}),e=>e.status===503&&!e.message.includes('privada'));
 }
});
test('SQL real isola titular, consulta sem claim e incerto, sem qualquer mutação',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec(`create schema private;create role service_role;grant usage on schema private to service_role;
 create table private.preparacoes_pagamento(id uuid primary key,cliente_usuario_id uuid);
 create table private.checkouts_pagbank_sandbox(preparacao_id uuid,usuario_id uuid,estado text,pagamento_real_habilitado boolean,repasse_habilitado boolean);
 grant select on all tables in schema private to service_role;`);
 await db.query('insert into private.preparacoes_pagamento values($1,$2)',[id,usuario]);
 const banco={begin:fn=>db.transaction(async t=>fn(async(strings,...valores)=>{
  const sql=strings.reduce((s,p,i)=>s+p+(i<valores.length?'$'+(i+1):''),'');
  return (await t.query(sql,valores)).rows;
 }))};
 const consultar=criarLeituraEstadoCheckout(banco);
 assert.equal((await consultar({preparacaoId:id,usuarioId:usuario})).estado,'nao_iniciado');
 assert.equal(await consultar({preparacaoId:id,usuarioId:outro}),null);
 await db.query("insert into private.checkouts_pagbank_sandbox values($1,$2,'incerto',false,false)",[id,usuario]);
 assert.equal((await consultar({preparacaoId:id,usuarioId:usuario})).estado,'incerto');
 const antes=(await db.query('select * from private.checkouts_pagbank_sandbox')).rows;
 const c=criarConsultaEstadoCheckout({ambiente:'sandbox',autenticar:async()=>({id:usuario,isAnonymous:false}),consultar});
 const h=criarHandlerPreparacao({preparador:c,origemPermitida:'https://teste.invalid'});
 const r=await h(new Request('https://teste.invalid/api/pagamentos/preparar',{method:'POST',headers:{'Content-Type':'application/json',Authorization:authorization},body:JSON.stringify(body)}));
 assert.equal(r.status,200);assert.equal((await r.json()).estado,'incerto');assert.equal(r.headers.get('Cache-Control'),'no-store');
 assert.deepEqual((await db.query('select * from private.checkouts_pagbank_sandbox')).rows,antes);
 await db.query('update private.checkouts_pagbank_sandbox set usuario_id=$1',[outro]);
 await assert.rejects(c.preparar({authorization,body}),e=>e.status===503);

});
