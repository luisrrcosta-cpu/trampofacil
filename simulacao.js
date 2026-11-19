'use strict';

// Referências da maquininha informadas pelo proprietário; não são tarifas online.
function simularPagamento({ valorCentavos, forma, parcelas = 1 }) {
  if (!Number.isSafeInteger(valorCentavos) || valorCentavos < 100 || valorCentavos > 100000000) {
    throw new Error('Informe um orçamento entre R$ 1,00 e R$ 1.000.000,00.');
  }
  if (!Number.isInteger(parcelas)) throw new Error('Escolha um número inteiro de parcelas.');
  let taxaPontosBase;
  if (forma === 'credito_avista' && parcelas === 1) taxaPontosBase = 400;
  else if (forma === 'credito_parcelado' && parcelas >= 2 && parcelas <= 10) taxaPontosBase = 1200;
  else throw new Error('Taxa não confirmada para esta forma de pagamento ou quantidade de parcelas.');

  const base = BigInt(valorCentavos);
  const escala = 10000n;
  const taxa = BigInt(taxaPontosBase);
  const divisor = escala - taxa;
  // Arredonda o total para cima, para a estimativa da taxa não reduzir o orçamento.
  const total = (base * escala + divisor - 1n) / divisor;
  const tarifa = (total * taxa + 5000n) / escala;
  const comissao = (base + 5n) / 10n;
  const valorParcela = total / BigInt(parcelas);
  const restantes = Number(total % BigInt(parcelas));
  return Object.freeze({
    valorServicoCentavos: valorCentavos,
    profissionalCentavos: Number(base - comissao),
    comissaoCentavos: Number(comissao),
    taxaPontosBase,
    tarifaEstimadaCentavos: Number(tarifa),
    ajusteArredondamentoCentavos: Number(total - tarifa - base),
    totalCentavos: Number(total),
    parcelasCentavos: Object.freeze(Array.from({ length: parcelas }, (_, i) => Number(valorParcela) + (i < restantes ? 1 : 0))),
    somenteSimulacao: true,
    impostosCalculados: false,
    taxasOnlineConfirmadas: false,
  });
}
