import {ErroPreparacaoPagamento} from './preparar-pagamento.js';

// Web Request/Response: pronto para adaptar a uma hospedagem de homologação.
// Não inicia servidor, não publica endpoint e não possui operação de cobrança.
export function criarHandlerPreparacao({preparador,origemPermitida,timeoutCorpoMs=5000}={}){
  let origem;
  try{origem=new URL(origemPermitida);}catch{throw new Error('Configure a origem da interface de homologação.');}
  if(origem.protocol!=='https:'||origem.origin!==origemPermitida||origem.username||origem.password)throw new Error('Origem HTTPS inválida.');
  if(typeof preparador?.preparar!=='function')throw new Error('Preparador não configurado.');
  if(!Number.isInteger(timeoutCorpoMs)||timeoutCorpoMs<1||timeoutCorpoMs>30000)throw new Error('Prazo de leitura inválido.');
  return async function handle(request){
    const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
    const responder=(status,body)=>new Response(JSON.stringify(body),{status,headers});
    const origemRecebida=request.headers.get('Origin');
    if(origemRecebida&&origemRecebida!==origemPermitida)return responder(403,{erro:'ORIGEM_NAO_PERMITIDA'});
    if(origemRecebida){headers['Access-Control-Allow-Origin']=origemPermitida;headers['Access-Control-Allow-Headers']='Authorization, Content-Type, apikey';headers['Access-Control-Allow-Methods']='POST, OPTIONS';}
    if(new URL(request.url).pathname!=='/api/pagamentos/preparar')return responder(404,{erro:'ROTA_INDISPONIVEL'});
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(request.method!=='POST')return responder(405,{erro:'METODO_NAO_PERMITIDO'});
    if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return responder(415,{erro:'JSON_NECESSARIO'});
    const limite=4096;
    const tamanho=request.headers.get('Content-Length');
    if(tamanho&&(!/^\d+$/.test(tamanho)||Number(tamanho)>limite))return responder(413,{erro:'CORPO_MUITO_GRANDE'});
    try{
      // Confere bytes reais, inclusive quando Content-Length está ausente ou falso.
      const reader=request.body?.getReader();let total=0;const partes=[];
      const excedido=Symbol('limite'),expirado=Symbol('prazo');let timer;
      try {
        await Promise.race([
          (async()=>{if(reader){while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>limite){reader.cancel().catch(()=>{});throw excedido;}partes.push(value);}}})(),
          new Promise((_,reject)=>{timer=setTimeout(()=>{reject(expirado);reader?.cancel().catch(()=>{});},timeoutCorpoMs);}),
        ]);
      }catch(erro){if(erro===excedido)return responder(413,{erro:'CORPO_MUITO_GRANDE'});if(erro===expirado)return responder(408,{erro:'TEMPO_DE_LEITURA_EXCEDIDO'});throw erro;}
      finally{clearTimeout(timer);}
      const bytes=new Uint8Array(total);let posicao=0;for(const parte of partes){bytes.set(parte,posicao);posicao+=parte.byteLength;}
      let body;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{return responder(400,{erro:'JSON_INVALIDO'});}
      const resultado=await preparador.preparar({authorization:request.headers.get('Authorization'),body});
      return responder(200,resultado);
    }catch(erro){
      if(erro instanceof ErroPreparacaoPagamento)return responder(erro.status,{erro:erro.codigo,mensagem:erro.message});
      return responder(503,{erro:'PREPARACAO_INDISPONIVEL'});
    }
  };
}
