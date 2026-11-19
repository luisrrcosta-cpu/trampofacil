'use strict';

// Validação de interface. A autorização definitiva deve ocorrer no banco.
const TRANSICOES_CONTRATACAO = Object.freeze({
  solicitada: Object.freeze({ profissional: ['proposta'], cliente: ['cancelada'], profissional_cancelar: ['cancelada'] }),
  proposta: Object.freeze({ profissional: ['proposta', 'cancelada'], cliente: ['aceita', 'cancelada'] }),
  aceita: Object.freeze({ profissional: ['em_andamento', 'cancelada'], cliente: ['cancelada'] }),
  em_andamento: Object.freeze({ profissional: ['entregue'] }),
  entregue: Object.freeze({ cliente: ['concluida'] }),
  concluida: Object.freeze({}),
  cancelada: Object.freeze({}),
});

function podeMudarContratacao(atual, proximo, papel) {
  if (!Object.prototype.hasOwnProperty.call(TRANSICOES_CONTRATACAO, atual)) return false;
  if (!['cliente', 'profissional'].includes(papel)) return false;
  const permitidos = TRANSICOES_CONTRATACAO[atual][papel] || [];
  if (permitidos.includes(proximo)) return true;
  return papel === 'profissional' && atual === 'solicitada' && proximo === 'cancelada';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TRANSICOES_CONTRATACAO, podeMudarContratacao };
}
