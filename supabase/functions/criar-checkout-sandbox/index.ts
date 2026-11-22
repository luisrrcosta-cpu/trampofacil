import postgres from 'npm:postgres@4.1.1';
import {validarConexaoBancoHomologacao,urlHomologacao,origemInterfaceHomologacao} from '../../../server/edge-homologacao.js';
import {criarAdaptadoresHomologacao} from '../../../server/supabase-homologacao.js';
import {criarHandlerPreparacao} from '../../../server/handler-preparacao.js';
import {criarCheckoutPagBankSandbox} from '../../../server/checkout-pagbank-sandbox.js';
import {criarOrquestradorCheckoutSandbox} from '../../../server/checkout-orquestrador-sandbox.js';
let handler;
try {
 if(Deno.env.get('SUPABASE_URL')!==urlHomologacao)throw new Error();
 const adaptadores=criarAdaptadoresHomologacao({ambiente:'teste',projetoHomologacaoConfirmado:true,
  supabaseUrl:urlHomologacao,chavePublicavel:'sb_publishable_LqyoPHGK1jifRxab6vPgYg_H26zanvz'});
 const api=criarCheckoutPagBankSandbox({ambiente:'sandbox',token:Deno.env.get('PAGBANK_SANDBOX_TOKEN')});
 let banco;
 const transacao=async f=>{
  banco??=postgres(validarConexaoBancoHomologacao(Deno.env.get('SUPABASE_DB_URL')));
  return banco.begin(async tx=>{await tx`set local role service_role`;return f(tx);});
 };
 const preparador=criarOrquestradorCheckoutSandbox({ambiente:'sandbox',autenticar:adaptadores.autenticar,
  iniciar:({preparacaoId,usuarioId})=>transacao(async tx=>{
   const r=await tx`select private.iniciar_checkout_sandbox(${preparacaoId}::uuid,${usuarioId}::uuid) as dados`;
   if(r.length!==1)throw new Error();return r[0].dados;
  }),
  finalizar:({id,checkoutId,url})=>transacao(async tx=>{
   const r=await tx`select private.finalizar_checkout_sandbox(${id}::uuid,${checkoutId}::text,${url}::text) as estado`;
   if(r.length!==1)throw new Error();return r[0].estado;
  }),
  criarCheckout:api.criar
 });
 const base=criarHandlerPreparacao({preparador,origemPermitida:origemInterfaceHomologacao});
 handler=request=>{
  const url=new URL(request.url);
  if(url.search||!['/criar-checkout-sandbox','/functions/v1/criar-checkout-sandbox'].includes(url.pathname))
   return new Response('{}',{status:404,headers:{'Cache-Control':'no-store'}});
  url.pathname='/api/pagamentos/preparar';return base(new Request(url,request));
 };
}catch{
 handler=()=>new Response(JSON.stringify({erro:'CHECKOUT_NAO_CONFIGURADO'}),{
  status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}
Deno.serve(handler);
