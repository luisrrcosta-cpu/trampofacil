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
