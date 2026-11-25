import postgres from 'npm:postgres@4.1.1';
import {validarConexaoBancoHomologacao,urlHomologacao,origemInterfaceHomologacao} from '../../../server/edge-homologacao.js';
import {criarAdaptadoresHomologacao} from '../../../server/supabase-homologacao.js';
import {criarHandlerPreparacao} from '../../../server/handler-preparacao.js';
import {criarConsultaEstadoCheckout} from '../../../server/estado-checkout-sandbox.js';
import {criarLeituraEstadoCheckout} from '../../../server/estado-checkout-banco.js';
let handler;
try {
 if(Deno.env.get('SUPABASE_URL')!==urlHomologacao)throw Error();
 const a=criarAdaptadoresHomologacao({ambiente:'teste',projetoHomologacaoConfirmado:true,supabaseUrl:urlHomologacao,chavePublicavel:'sb_publishable_LqyoPHGK1jifRxab6vPgYg_H26zanvz'});
 let leitura;
 const preparador=criarConsultaEstadoCheckout({ambiente:'sandbox',autenticar:a.autenticar,
  consultar:dados=>{leitura??=criarLeituraEstadoCheckout(postgres(validarConexaoBancoHomologacao(Deno.env.get('SUPABASE_DB_URL'))));return leitura(dados);}});
 const base=criarHandlerPreparacao({preparador,origemPermitida:origemInterfaceHomologacao});
 handler=request=>{
  const u=new URL(request.url);
  if(u.search||!['/consultar-tentativa-checkout-sandbox','/functions/v1/consultar-tentativa-checkout-sandbox'].includes(u.pathname))return new Response('{}',{status:404,headers:{'Cache-Control':'no-store'}});
  u.pathname='/api/pagamentos/preparar';return base(new Request(u,request));
 };
}catch{handler=()=>new Response('{"erro":"CONSULTA_NAO_CONFIGURADA"}',{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}
Deno.serve(handler);
