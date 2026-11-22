// Validador interno do novo modelo x-payload-signature; não expõe rota HTTP.
// A chave deve vir da configuração confiável do servidor (type=webhook).
import {createPublicKey, verify} from 'node:crypto';
import {Buffer} from 'node:buffer';
const base64 = valor => typeof valor==='string' && valor.length>0 &&
  valor.length%4===0 && /^[A-Za-z0-9+/]+={0,2}$/.test(valor) &&
  Buffer.from(valor,'base64').toString('base64')===valor;
export function criarValidadorWebhookSandbox({ambiente,chavePublicaBase64}={}) {
  if(ambiente!=='sandbox' || !base64(chavePublicaBase64) || chavePublicaBase64.length>8192) {
    throw new Error('Chave confiável de webhook sandbox necessária.');
  }
  let chave;
  try {
    chave=createPublicKey({key:Buffer.from(chavePublicaBase64,'base64'),format:'der',type:'spki'});
    if(chave.asymmetricKeyType!=='ec')throw new Error();
  } catch { throw new Error('Chave confiável de webhook sandbox necessária.'); }
  return Object.freeze({
    validar({corpoBruto,assinaturas}={}) {
      // Não aceitar string ou objeto reconstruído a partir de JSON.
      if(!(corpoBruto instanceof Uint8Array) || corpoBruto.byteLength===0 ||
          corpoBruto.byteLength>65536) return false;
      const headers=Array.isArray(assinaturas)?assinaturas:[assinaturas];
      if(headers.length>8 || headers.some(v=>typeof v!=='string'))return false;
      if(headers.reduce((n,v)=>n+v.length,0)>8192)return false;
      const valores=headers.flatMap(v=>v.split(',')).map(v=>v.trim()).filter(Boolean);
      if(valores.length===0 || valores.length>8)return false;
      return valores.some(valor=>{
        if(valor.length>1024 || !base64(valor))return false;
        try { return verify('sha256',corpoBruto,chave,Buffer.from(valor,'base64')); }
        catch { return false; }
      });
    }
  });
}
