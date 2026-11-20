// Uso interno do servidor, ainda sem rota ou credencial configurada.
// GET documentado: https://developer.pagbank.com.br/reference/consultar-pagamento
const origem = 'https://sandbox.api.pagseguro.com';
const estados = new Set(['AUTHORIZED','PAID','IN_ANALYSIS','DECLINED','CANCELED','WAITING']);
const identificador = /^CHAR_[A-Za-z0-9-]{1,100}$/;
const centavos = valor => Number.isSafeInteger(valor) && valor >= 0 && valor <= 999999999;
const indisponivel = () => new Error('Não foi possível conferir a cobrança de teste.');

export function criarConsultaPagBankSandbox({ambiente,token,fetchImpl=globalThis.fetch,timeoutMs=10000}={}) {
  if (ambiente !== 'sandbox' || typeof token !== 'string' || !/^[A-Za-z0-9._-]{1,4096}$/.test(token) ||
      typeof fetchImpl !== 'function' || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) {
    throw new Error('Configure somente a consulta interna do PagBank sandbox.');
  }
  return Object.freeze({
    // Valores esperados devem vir da futura tentativa persistida, nunca do navegador/webhook.
    async consultar({cobrancaId,referenciaEsperada,valorEsperadoCentavos}={}) {
      if (!identificador.test(cobrancaId || '') || typeof referenciaEsperada !== 'string' ||
          !referenciaEsperada || referenciaEsperada.length > 64 ||
          !centavos(valorEsperadoCentavos) || valorEsperadoCentavos < 1) throw indisponivel();
      try {
        const resposta = await fetchImpl(`${origem}/charges/${cobrancaId}`, {
          method:'GET', headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},
          redirect:'error', credentials:'omit', cache:'no-store', signal:AbortSignal.timeout(timeoutMs),
        });
        if (!resposta.ok) throw indisponivel();
        const dados = await resposta.json();
        const resumo = dados?.amount?.summary;
        if (dados?.id !== cobrancaId || dados.reference_id !== referenciaEsperada ||
            !estados.has(dados.status) || dados.amount?.currency !== 'BRL' ||
            dados.amount.value !== valorEsperadoCentavos || !resumo ||
            ![resumo.total,resumo.paid,resumo.refunded].every(centavos) ||
            resumo.total !== valorEsperadoCentavos || resumo.paid > resumo.total ||
            resumo.refunded > resumo.paid || (dados.status === 'PAID' && resumo.paid !== resumo.total)) {
          throw indisponivel();
        }
        // Retorno mínimo. Não propagar cartão, CPF, contato, links ou resposta bruta.
        // Não transforma estado de serviço nem registra pagamento/repasse.
        return Object.freeze({ambiente:'sandbox',cobrancaId:dados.id,statusProvedor:dados.status,
          valorCentavos:resumo.total,pagoCentavos:resumo.paid,devolvidoCentavos:resumo.refunded});
      } catch { throw indisponivel(); }
    },
  });
}
