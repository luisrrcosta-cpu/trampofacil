import {ErroPreparacaoPagamento} from './preparar-pagamento.js';
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const estados=new Set(['nao_iniciado','envio_iniciado','criado','incerto','bloqueado']);
// Consulta local autenticada: não contata PagBank e não permite novo envio.
export function criarConsultaEstadoCheckout({ambiente,autenticar,consultar}={}) {
 if(ambiente!=='sandbox'||typeof autenticar!=='function'||typeof consultar!=='function')throw Error('Consulta restrita ao sandbox.');
 const falhar=(codigo,status)=>{throw new ErroPreparacaoPagamento(codigo,status,'Não foi possível consultar a tentativa de teste.');};
 return Object.freeze({async preparar({authorization,body}={}){
  const token=/^Bearer ([^\s]+)$/.exec(authorization||'')?.[1];if(!token)falhar('NAO_AUTENTICADO',401);
  let u;try{u=await autenticar(token);}catch{falhar('NAO_AUTENTICADO',401);}
  if(!uuid(u?.id)||u.isAnonymous!==false)falhar('NAO_AUTENTICADO',401);
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==1||!uuid(body.preparacaoId))falhar('PEDIDO_INVALIDO',400);
  let r;try{r=await consultar({preparacaoId:body.preparacaoId,usuarioId:u.id});}catch{falhar('CONSULTA_INDISPONIVEL',503);}
  if(!r||r.cliente_usuario_id!==u.id||r.preparacao_id!==body.preparacaoId)falhar('TENTATIVA_INDISPONIVEL',404);
  if(!estados.has(r.estado)||r.pagamento_real_habilitado!==false||r.repasse_habilitado!==false)falhar('CONSULTA_INDISPONIVEL',503);
  return Object.freeze({preparacaoId:body.preparacaoId,estado:r.estado,ambiente:'sandbox',pagamentoConfirmado:false,liberarRepasse:false});
 }});
}
