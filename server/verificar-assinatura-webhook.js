import {createPublicKey, verify} from 'node:crypto';

// Verificação criptográfica offline; não processa nem confirma pagamentos.
// Usar somente após confirmar que o produto PagBank usa x-payload-signature.
export function verificarAssinaturaWebhook({corpoBruto, cabecalhoAssinatura, chavePublicaBase64}={}) {
  if (!Buffer.isBuffer(corpoBruto) || corpoBruto.length===0 || corpoBruto.length>262144) return false;
  if (typeof chavePublicaBase64!=='string' || chavePublicaBase64.length>4096 || !/^[A-Za-z0-9+/]+={0,2}$/.test(chavePublicaBase64)) return false;
  const assinaturas = Array.isArray(cabecalhoAssinatura) ? cabecalhoAssinatura : typeof cabecalhoAssinatura==='string' ? cabecalhoAssinatura.split(',') : [];
  if (assinaturas.length<1 || assinaturas.length>4) return false;
  let chave;
  try {
    chave=createPublicKey({key:Buffer.from(chavePublicaBase64,'base64'),format:'der',type:'spki'});
    if (chave.asymmetricKeyType!=='ec') return false;
  } catch { return false; }
  return assinaturas.some(valor=>{
    const assinatura=typeof valor==='string'?valor.trim():'';
    if (!assinatura || assinatura.length>512 || !/^[A-Za-z0-9+/]+={0,2}$/.test(assinatura)) return false;
    try {return verify('sha256',corpoBruto,chave,Buffer.from(assinatura,'base64'));}
    catch {return false;}
  });
}
