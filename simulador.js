'use strict';

const formularioSimulacao = elemento('form-simulacao');
const formaSimulacao = formularioSimulacao.elements.forma;
const parcelasSimulacao = formularioSimulacao.elements.parcelas;
const resultadoSimulacao = elemento('resultado-simulacao');
function limparSimulacao() {
  resultadoSimulacao.replaceChildren();
  elemento('erro-simulacao').textContent = '';
}
formaSimulacao.addEventListener('change', () => {
  parcelasSimulacao.disabled = formaSimulacao.value !== 'credito_parcelado';
  if (parcelasSimulacao.disabled) parcelasSimulacao.value = '1';
  else if (parcelasSimulacao.value === '1') parcelasSimulacao.value = '10';
  limparSimulacao();
});
formularioSimulacao.addEventListener('input', limparSimulacao);
formularioSimulacao.addEventListener('submit', (evento) => {
  evento.preventDefault();
  limparSimulacao();
  try {
    const dados = simularPagamento({
      valorCentavos: propostaEmCentavos(formularioSimulacao.elements.valor.value),
      forma: formaSimulacao.value,
      parcelas: Number(parcelasSimulacao.value),
    });
    const tabela = document.createElement('table');
    tabela.setAttribute('aria-label', 'Divisão estimada do pagamento');
    for (const [rotulo, valor] of [
      ['Orçamento do serviço', dados.valorServicoCentavos],
      ['Profissional', dados.profissionalCentavos],
      ['Comissão TrampoFácil (10%)', dados.comissaoCentavos],
      ['Taxa estimada de pagamento', dados.tarifaEstimadaCentavos],
      ['Ajuste de arredondamento', dados.ajusteArredondamentoCentavos],
      ['Total estimado para o cliente', dados.totalCentavos],
    ]) {
      const linha = document.createElement('tr');
      const titulo = texto('th', rotulo); titulo.scope = 'row';
      linha.append(titulo, texto('td', moeda.format(valor / 100)));
      tabela.append(linha);
    }
    resultadoSimulacao.append(tabela);
    const grupos = new Map();
    for (const valor of dados.parcelasCentavos) grupos.set(valor, (grupos.get(valor) || 0) + 1);
    resultadoSimulacao.append(texto('p', 'Parcelas estimadas: ' + [...grupos].map(([valor, quantidade]) => `${quantidade} × ${moeda.format(valor / 100)}`).join(' + ')));
    resultadoSimulacao.append(texto('p', 'Simulação sem cobrança. Impostos e tarifas fixas não calculados. As taxas online do PagBank ainda precisam ser confirmadas.'));
  } catch (falha) {
    elemento('erro-simulacao').textContent = falha.message;
  }
});
