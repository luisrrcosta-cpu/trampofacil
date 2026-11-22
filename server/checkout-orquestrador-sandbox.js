import {ErroPreparacaoPagamento} from './preparar-pagamento.js';
import {validarUrlCheckoutSandbox} from './checkout-pagbank-sandbox.js';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function criarOrquestradorCheckoutSandbox({ambiente,autenticar,iniciar,finalizar,criarCheckout,agora=Date.now}={}) {
 if(ambiente!=='sandbox'||[autenticar,iniciar,finalizar,criarCheckout].some(f=>typeof f!=='function'))throw new Error('Checkout sandbox inválido.');
 const erro=(codigo,status)=>{throw new ErroPreparacaoPagamento(codigo,status,'Checkout sandbox indisponível.');};
 return Object.freeze({async preparar({authorization,body}={}) {
  const token=/^Bearer ([^\s]+)$/.exec(authorization||'')?.[1];if(!token)erro('NAO_AUTENTICADO',401);
  let usuario;try{usuario=await autenticar(token);}catch{erro('NAO_AUTENTICADO',401);}
  if(!uuid.test(usuario?.id||'')||usuario.isAnonymous!==false)erro('NAO_AUTENTICADO',401);
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==1||!uuid.test(body.preparacaoId||''))erro('PEDIDO_INVALIDO',400);
  let c;try{c=await iniciar({preparacaoId:body.preparacaoId,usuarioId:usuario.id});}
  catch(e){erro(e?.code==='22023'?'ORCAMENTO_ALTERADO':e?.code==='P0002'?'INDISPONIVEL':'REGISTRO_INDISPONIVEL',e?.code==='22023'?409:e?.code==='P0002'?404:503);}
  if(!uuid.test(c?.id||'')||c.referencia!=='tf-sandbox-'+c.id||!Number.isSafeInteger(c.valorCentavos))erro('REGISTRO_INDISPONIVEL',503);
  const idade=agora()-Date.parse(c.criadoEm);
  if(!Number.isFinite(idade)||idade< -60000||idade>=15*60000)erro('CHECKOUT_EXPIRADO',409);
  const resultado=d=>Object.freeze({checkoutId:d.checkoutId,url:d.url,ambiente:'sandbox',pagamentoRealHabilitado:false,repasseHabilitado:false});
  if(c.novo===false) {
   if(c.estado==='criado'&&validarUrlCheckoutSandbox(c.url))return resultado(c);
   erro('CHECKOUT_PENDENTE_DE_CONFERENCIA',409);
  }
  if(c.novo!==true||c.estado!=='envio_iniciado')erro('REGISTRO_INDISPONIVEL',503);
  let d;
  try{d=await criarCheckout(c);}catch{
   try{await finalizar({id:c.id,checkoutId:null,url:null});}catch{}
   erro('CHECKOUT_NAO_CONFIRMADO',503);
  }
  let estado;try{estado=await finalizar({id:c.id,...d});}catch{erro('CHECKOUT_NAO_CONFIRMADO',503);}
  if(estado!=='criado')erro('ORCAMENTO_ALTERADO',409);
  return resultado(d);
 }});
}
