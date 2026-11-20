// Avaliação pura de uma consulta feita pelo adaptador interno de sandbox.
// Não autentica notificações, não altera banco e não autoriza repasses.
export function conferirConsultaPagBank(consulta, tentativa) {
  const revisar = () => Object.freeze({situacao:'revisao_necessaria',liberarRepasse:false});
  const inteiro = v => Number.isSafeInteger(v) && v >= 0 && v <= 999999999;
  if (!consulta || !tentativa || consulta.ambiente !== 'sandbox' || tentativa.ambiente !== 'sandbox' ||
      typeof tentativa.cobrancaId !== 'string' || !/^CHAR_[A-Za-z0-9-]{1,100}$/.test(tentativa.cobrancaId) ||
      consulta.cobrancaId !== tentativa.cobrancaId || !inteiro(tentativa.valorCentavos) ||
      tentativa.valorCentavos < 1 || consulta.valorCentavos !== tentativa.valorCentavos ||
      !inteiro(consulta.pagoCentavos) || !inteiro(consulta.devolvidoCentavos) ||
      consulta.pagoCentavos > consulta.valorCentavos || consulta.devolvidoCentavos > consulta.pagoCentavos) return revisar();
  const {statusProvedor:status,pagoCentavos:pago,devolvidoCentavos:devolvido,valorCentavos:valor} = consulta;
  let situacao;
  if (status === 'PAID' && pago === valor) {
    situacao = devolvido === 0 ? 'pagamento_observado' : devolvido === pago ? 'devolucao_total' : 'devolucao_parcial';
  } else if (status === 'CANCELED' && pago === valor && devolvido === pago) {
    situacao = 'devolucao_total';
  } else if (pago === 0 && devolvido === 0) {
    const estados = {WAITING:'aguardando_pagamento',AUTHORIZED:'somente_autorizado',
      IN_ANALYSIS:'em_analise',DECLINED:'recusado',CANCELED:'cancelado'};
    if (Object.hasOwn(estados,status)) situacao = estados[status];
  }
  if (!situacao) return revisar();
  return Object.freeze({situacao,valorCentavos:valor,pagoCentavos:pago,
    devolvidoCentavos:devolvido,saldoObservadoCentavos:pago-devolvido,liberarRepasse:false});
}
