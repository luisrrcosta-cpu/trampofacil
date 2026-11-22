// Consulta interna, sem criar chave, pedido, cobrança ou repasse.
const origem = 'https://sandbox.api.pagseguro.com';
export function criarConsultaChaveSandbox({ambiente, token, fetchImpl=globalThis.fetch}={}) {
  if (ambiente !== 'sandbox' || typeof token !== 'string' ||
      !/^[A-Za-z0-9._-]{1,4096}$/.test(token) || typeof fetchImpl !== 'function') {
    throw new Error('Configuração sandbox inválida.');
  }
  return Object.freeze({
    async consultar() {
      try {
        const r=await fetchImpl(origem+'/public-keys/card', {
          method:'GET',headers:{Authorization:'Bearer '+token,Accept:'application/json'},
          credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(8000)
        });
        if (r.status===401 || r.status===403) return Object.freeze({estado:'CREDENCIAL_RECUSADA'});
        if (r.status===404) return Object.freeze({estado:'CHAVE_NAO_DISPONIVEL'});
        if (!r.ok) return Object.freeze({estado:'CONSULTA_INDISPONIVEL'});
        const d=await r.json();
        if (typeof d?.public_key !== 'string' || d.public_key.length<100 ||
            d.public_key.length>8192 || !/^[A-Za-z0-9+/]+={0,2}$/.test(d.public_key)) {
          return Object.freeze({estado:'RESPOSTA_INVALIDA'});
        }
        // Nem token nem resposta bruta são propagados.
        return Object.freeze({estado:'CHAVE_DISPONIVEL'});
      } catch { return Object.freeze({estado:'CONSULTA_INDISPONIVEL'}); }
    }
  });
}
