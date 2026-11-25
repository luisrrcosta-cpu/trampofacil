// Consulta interna somente de leitura. Contexto vem do servidor autorizado.
// Não resolve uma tentativa sem CHEC_id, não modifica o claim e não confirma pagamento.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const indisponivel=()=>new Error('Não foi possível conferir o checkout de teste.');
export function criarConsultaCheckoutSandbox({ambiente,token,fetchImpl=globalThis.fetch,timeoutMs=10000}={}) {
 if(ambiente!=='sandbox'||typeof token!=='string'||!/^[A-Za-z0-9._-]{1,4096}$/.test(token)||
    typeof fetchImpl!=='function'||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)
  throw new Error('Consulta restrita ao servidor de sandbox.');
 return Object.freeze({async consultar({checkoutId,id,referencia,valorCentavos}={}) {
  if(typeof checkoutId!=='string'||!/^CHEC_[A-Za-z0-9-]{1,100}$/.test(checkoutId)||
     typeof id!=='string'||!uuid.test(id)||referencia!=='tf-sandbox-'+id||
     !Number.isSafeInteger(valorCentavos)||valorCentavos<100||valorCentavos>100000000)throw indisponivel();
  try {
   const r=await fetchImpl('https://sandbox.api.pagseguro.com/checkouts/'+checkoutId,{
    method:'GET',headers:{Authorization:'Bearer '+token,Accept:'application/json'},
    redirect:'error',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(timeoutMs)
   });
   if(r.status!==200)throw indisponivel();
   const d=await r.json();
   if(d?.id!==checkoutId||d.reference_id!==referencia||!['ACTIVE','INACTIVE','EXPIRED'].includes(d.status)||
      !Array.isArray(d.items)||d.items.length!==1||d.items[0]?.reference_id!==id||
      d.items[0]?.unit_amount!==valorCentavos||d.items[0]?.quantity!==1||
      (d.additional_amount??0)!==0||(d.discount_amount??0)!==0||d.shipping||d.recurrence_plan)throw indisponivel();
   // Ignora links e pagamentos associados; não devolve dados pessoais ou resposta bruta.
   return Object.freeze({ambiente:'sandbox',checkoutId,statusCheckout:d.status,valorCentavos,
    pagamentoConfirmado:false,liberarRepasse:false});
  }catch{throw indisponivel();}
 }});
}
