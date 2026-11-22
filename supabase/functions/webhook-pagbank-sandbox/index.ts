import postgres from 'npm:postgres@4.1.1';
import {validarConexaoBancoHomologacao,urlHomologacao} from '../../../server/edge-homologacao.js';
import {criarConsultaValidadorSandbox} from '../../../server/webhook-chave-sandbox.js';
import {criarReceptorWebhookSandbox} from '../../../server/webhook-receptor-sandbox.js';
// Não utiliza JWT de cliente: cada POST é autenticado pela assinatura do PagBank.
let handler;
try {
  if(Deno.env.get('SUPABASE_URL')!==urlHomologacao)throw new Error();
  const chave=criarConsultaValidadorSandbox({ambiente:'sandbox',token:Deno.env.get('PAGBANK_SANDBOX_TOKEN')});
  let banco;
  handler=criarReceptorWebhookSandbox({
    ambiente:'sandbox',obterValidador:()=>chave.obter(),
    registrar:async({hash,cobrancas})=>{
      // Só abre conexão após assinatura válida e parsing mínimo autorizado.
      banco??=postgres(validarConexaoBancoHomologacao(Deno.env.get('SUPABASE_DB_URL')));
      return banco.begin(async tx=>{
        await tx`set local role service_role`;
        const rows=await tx`select private.receber_webhook_sandbox(${hash}::text,${tx.array(cobrancas)}::text[]) as novo`;
        if(rows.length!==1||typeof rows[0].novo!=='boolean')throw new Error();
        return rows[0].novo;
      });
    }
  });
} catch {
  handler=()=>new Response(JSON.stringify({erro:'RECEPTOR_NAO_CONFIGURADO'}),{
    status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}
Deno.serve(handler);
