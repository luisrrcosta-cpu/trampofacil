import {criarValidadorWebhookSandbox} from './webhook-assinatura-sandbox.js';
// Consulta somente leitura ao novo serviço de notificações documentado pelo PagBank.
export function criarConsultaValidadorSandbox({ambiente,token,fetchImpl=globalThis.fetch,agora=Date.now}={}) {
  if(ambiente!=='sandbox' || typeof token!=='string' ||
     !/^[A-Za-z0-9._-]{1,4096}$/.test(token) || typeof fetchImpl!=='function' ||
     typeof agora!=='function')throw new Error('Configuração sandbox inválida.');
  let cache,expira=0,pendente;
  return Object.freeze({
    async obter() {
      if(cache && agora()<expira)return cache;
      if(pendente)return pendente;
      pendente=(async()=>{
        try {
          const r=await fetchImpl('https://sandbox.api.pagseguro.com/public-keys/webhook',{
            method:'GET',headers:{Authorization:'Bearer '+token,Accept:'application/json'},
            redirect:'error',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(8000)
          });
          if(!r.ok)throw new Error();
          const dados=await r.json();
          const validador=criarValidadorWebhookSandbox({ambiente:'sandbox',chavePublicaBase64:dados?.public_key});
          cache=validador;expira=agora()+600000;
          return validador;
        } catch {throw new Error('Chave de webhook sandbox indisponível.');}
        finally {pendente=undefined;}
      })();
      return pendente;
    }
  });
}
