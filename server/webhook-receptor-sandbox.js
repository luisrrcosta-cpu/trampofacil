import {createHash} from 'node:crypto';
// Recebe apenas notificações assinadas; não confirma pagamento ou executa repasse.
export function criarReceptorWebhookSandbox({ambiente,obterValidador,registrar,timeoutMs=5000}={}) {
  if(ambiente!=='sandbox'||typeof obterValidador!=='function'||typeof registrar!=='function'||
     !Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>10000)throw new Error('Receptor sandbox inválido.');
  return async request=>{
    const resposta=(status,erro)=>new Response(JSON.stringify(erro?{erro}:{recebida:true,financeiroProcessado:false}),{
      status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    const url=new URL(request.url);
    if(url.search||!['/webhook-pagbank-sandbox','/functions/v1/webhook-pagbank-sandbox'].includes(url.pathname))return resposta(404,'ROTA_INDISPONIVEL');
    if(request.method!=='POST')return resposta(405,'METODO_NAO_PERMITIDO');
    const assinatura=request.headers.get('x-payload-signature');
    if(!assinatura||assinatura.length>8192)return resposta(401,'ASSINATURA_INVALIDA');
    if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return resposta(415,'JSON_NECESSARIO');
    const tamanho=request.headers.get('Content-Length');
    if(tamanho&&(!/^\d+$/.test(tamanho)||Number(tamanho)>65536))return resposta(413,'CORPO_MUITO_GRANDE');
    let bytes;const reader=request.body?.getReader();let timer;
    const limite=Symbol(),prazo=Symbol();
    try {
      bytes=await Promise.race([
        (async()=>{const partes=[];let total=0;
          if(reader)while(true){const {done,value}=await reader.read();if(done)break;
            total+=value.byteLength;if(total>65536)throw limite;partes.push(value);}
          const resultado=new Uint8Array(total);let p=0;for(const v of partes){resultado.set(v,p);p+=v.length;}return resultado;
        })(),
        new Promise((_,reject)=>{timer=setTimeout(()=>reject(prazo),timeoutMs);})
      ]);
    }catch(e){reader?.cancel().catch(()=>{});return resposta(e===limite?413:e===prazo?408:400,'CORPO_INVALIDO');}
    finally{clearTimeout(timer);}
    let validador;try{validador=await obterValidador();}catch{return resposta(503,'CHAVE_INDISPONIVEL');}
    if(!validador.validar({corpoBruto:bytes,assinaturas:assinatura}))return resposta(401,'ASSINATURA_INVALIDA');
    let evento;
    try{evento=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{return resposta(400,'JSON_INVALIDO');}
    // Usar somente IDs; ignorar links, contatos, cartões, status e valores do payload.
    const charges=evento?.charges;
    if(!Array.isArray(charges)||charges.length<1||charges.length>10||
       charges.some(c=>typeof c?.id!=='string'||!/^CHAR_[A-Za-z0-9-]{1,100}$/.test(c.id)))return resposta(422,'EVENTO_NAO_SUPORTADO');
    const cobrancas=[...new Set(charges.map(c=>c.id))].sort();
    if(cobrancas.length!==charges.length)return resposta(422,'EVENTO_NAO_SUPORTADO');
    try {
      await registrar({hash:createHash('sha256').update(bytes).digest('hex'),cobrancas});
      return resposta(202);
    }catch{return resposta(503,'REGISTRO_INDISPONIVEL');}
  };
}
