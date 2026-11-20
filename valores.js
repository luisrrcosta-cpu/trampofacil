'use strict';

// Valores monetários nunca passam por arredondamento de ponto flutuante.
function propostaEmCentavos(valor) {
  if (typeof valor !== 'string') throw new Error('Informe um valor em reais.');
  const partes = /^(\d{1,7})(?:[.,](\d{1,2}))?$/.exec(valor.trim());
  if (!partes) throw new Error('Informe até duas casas decimais, sem separador de milhar.');
  const centavos = Number(partes[1]) * 100 + Number((partes[2] || '').padEnd(2, '0'));
  if (centavos < 100 || centavos > 100000000) {
    throw new Error('O orçamento deve ficar entre R$ 1,00 e R$ 1.000.000,00.');
  }
  return centavos;
}

function validarResultadoPreparacao(dados, pedido, condicoes) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const valor = dados?.valorServicoCentavos;
  if (!dados || dados.pagamentoHabilitado !== false || dados.preparacaoRegistrada !== true ||
      !uuid.test(dados.preparacaoId || '') || dados.solicitacaoId !== pedido.id ||
      dados.versaoOrcamento !== pedido.atualizado_em || valor !== pedido.valor_centavos ||
      !Number.isSafeInteger(valor) || valor < 100 || valor > 100000000 ||
      dados.comissaoCentavos !== Math.floor((valor + 5) / 10) ||
      dados.profissionalCentavos !== valor - dados.comissaoCentavos ||
      dados.forma !== condicoes.forma || dados.parcelas !== condicoes.parcelas) {
    throw new Error('O resultado não corresponde ao orçamento selecionado. Atualize a solicitação.');
  }
  return dados;
}
