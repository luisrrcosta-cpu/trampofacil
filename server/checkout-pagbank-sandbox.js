const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validarUrlCheckoutSandbox(valor) {
 try {
  const u=new URL(valor);
  return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&
   ['qa.pagamento.pagseguro.uol.com.br','sandbox.pagamento.pagseguro.uol.com.br','qa.pagamento.pagbank.com.br','sandbox.pagamento.pagbank.com.br'].includes(u.hostname)&&
   u.pathname==='/pagamento'&&[...u.searchParams].length===1&&/^[A-Za-z0-9-]{1,100}$/.test(u.searchParams.get('code')||'');
 }catch{return false;}
}
export function criarCheckoutPagBankSandbox({ambiente,token,fetchImpl=globalThis.fetch,registrarFalha=()=>{}}={}) {
 if(ambiente!=='sandbox'||typeof token!=='string'||!/^[A-Za-z0-9._-]{1,4096}$/.test(token)||typeof fetchImpl!=='function'||typeof registrarFalha!=='function')throw new Error('Configuração sandbox inválida.');
 return Object.freeze({
  async criar({id,referencia,valorCentavos,criadoEm}={}) {
   if(!uuid.test(id||'')||referencia!=='tf-sandbox-'+id||!Number.isSafeInteger(valorCentavos)||valorCentavos<100||valorCentavos>100000000||
      !Number.isFinite(Date.parse(criadoEm)))throw new Error('Checkout inválido.');
   const body={
    reference_id:referencia,customer_modifiable:true,
    items:[{reference_id:id,name:'Servico ficticio TrampoFacil - SANDBOX',quantity:1,unit_amount:valorCentavos}],
    payment_methods:[{type:'CREDIT_CARD'}],
    payment_methods_configs:[{type:'CREDIT_CARD',config_options:[{option:'INSTALLMENTS_LIMIT',value:'1'}]}],
    expiration_date:new Date(Date.parse(criadoEm)+15*60000).toISOString(),
    payment_notification_urls:['https://asdszqtpydiowgerxwee.supabase.co/functions/v1/webhook-pagbank-sandbox'],
    return_url:'https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site'
   };
   let categoria='TRANSPORTE';let statusHttp;
   try {
    const r=await fetchImpl('https://sandbox.api.pagseguro.com/checkouts',{
      method:'POST',headers:{Authorization:'Bearer '+token,Accept:'application/json','Content-Type':'application/json'},
      body:JSON.stringify(body),credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(10000)
    });
    if(!r.ok){categoria='HTTP';if(Number.isInteger(r.status)&&r.status>=400&&r.status<=599)statusHttp=r.status;throw new Error();}
    categoria='RESPOSTA_INVALIDA';
    const d=await r.json();const links=Array.isArray(d?.links)?d.links.filter(x=>x?.rel==='PAY'):[];
    if(typeof d?.id!=='string'||!/^CHEC_[A-Za-z0-9-]{1,100}$/.test(d.id)||d.reference_id!==referencia||
       d.status!=='ACTIVE'||!Array.isArray(d.items)||d.items.length!==1||
       d.items[0]?.unit_amount!==valorCentavos||d.items[0]?.quantity!==1||
       (d.additional_amount??0)!==0||(d.discount_amount??0)!==0||d.recurrence_plan||d.shipping||
       links.length!==1||!validarUrlCheckoutSandbox(links[0]?.href))throw new Error();
    return Object.freeze({checkoutId:d.id,url:links[0].href});
   }catch {
    try{registrarFalha(Object.freeze({categoria,...(statusHttp===undefined?{}:{statusHttp})}));}catch{}
    throw new Error('Resultado do checkout sandbox não confirmado. Não reenviar automaticamente.');}
  }
 });
}
