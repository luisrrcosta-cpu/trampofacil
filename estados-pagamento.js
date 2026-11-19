'use strict';

// Modelo de estados financeiros separado do andamento do serviço.
// Não inicia cobranças, estornos ou repasses. Somente o servidor poderá
// confirmar transições após verificar a resposta assinada do provedor.
const ESTADOS_PAGAMENTO = Object.freeze({
  PENDENTE: 'pendente',
  AGUARDANDO: 'aguardando_pagamento',
  PAGO: 'pago',
  FALHOU: 'falhou',
  CANCELADO: 'cancelado',
  REEMBOLSO_PENDENTE: 'reembolso_pendente',
  REEMBOLSADO: 'reembolsado',
});

const TRANSICOES_PAGAMENTO = Object.freeze({
  pendente: Object.freeze(['aguardando_pagamento', 'cancelado']),
  aguardando_pagamento: Object.freeze(['pago', 'falhou', 'cancelado']),
  pago: Object.freeze(['reembolso_pendente']),
  falhou: Object.freeze([]),
  cancelado: Object.freeze([]),
  reembolso_pendente: Object.freeze(['reembolsado', 'pago']),
  reembolsado: Object.freeze([]),
});

function podeTransicionarPagamento(atual, proximo) {
  return Object.prototype.hasOwnProperty.call(TRANSICOES_PAGAMENTO, atual)
    && TRANSICOES_PAGAMENTO[atual].includes(proximo);
}

function validarTransicaoPagamento(atual, proximo, origem) {
  if (origem !== 'servidor_verificado') {
    throw new Error('O estado financeiro só pode ser confirmado pelo servidor.');
  }
  if (!podeTransicionarPagamento(atual, proximo)) {
    throw new Error('Transição financeira não permitida.');
  }
  return proximo;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ESTADOS_PAGAMENTO, TRANSICOES_PAGAMENTO, podeTransicionarPagamento, validarTransicaoPagamento };
}
