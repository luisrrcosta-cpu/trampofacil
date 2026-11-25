'use strict';

const secaoPreparacao = elemento('preparacao');
const formPreparacao = elemento('form-preparacao');
const statusPreparacao = elemento('status-preparacao');
const resultadoPreparacao = elemento('resultado-preparacao');
const tentativasPreparacao = new Map();
let preparacaoAtual;

function limparPreparacao() {
  if (preparacaoAtual?.carregando) bloquear(secaoPreparacao, false);
  preparacaoAtual = undefined;
  tentativasPreparacao.clear();
  resultadoPreparacao.replaceChildren();
  statusPreparacao.textContent = '';
  elemento('pedido-preparacao').textContent = '';
  formPreparacao.reset();
}

function controlesPreparacao() {
  const tentativa = preparacaoAtual?.tentativa;
  formPreparacao.elements.forma.disabled = Boolean(tentativa);
  formPreparacao.elements.parcelas.disabled = Boolean(tentativa) || formPreparacao.elements.forma.value === 'credito_avista';
  const botao = formPreparacao.querySelector('button');
  botao.disabled = Boolean(tentativa?.resultado);
  botao.textContent = tentativa?.resultado ? 'Preparação de teste registrada'
    : tentativa ? 'Conferir preparação de teste' : 'Registrar preparação de teste';
}

function exibirPreparacao(dados) {
  resultadoPreparacao.replaceChildren();
  const tabela = document.createElement('table');
  const legenda = texto('caption', 'Divisão do valor do serviço — sem cobrança');
  tabela.append(legenda);
  for (const [rotulo, valor] of [['Valor do serviço', dados.valorServicoCentavos],
    ['Profissional', dados.profissionalCentavos], ['Comissão da plataforma, antes de impostos', dados.comissaoCentavos]]) {
    const linha = document.createElement('tr');
    const titulo = texto('th', rotulo); titulo.scope = 'row';
    linha.append(titulo, texto('td', moeda.format(valor / 100))); tabela.append(linha);
  }
  resultadoPreparacao.append(tabela, texto('p', `Referência de teste: ${dados.preparacaoId}`));
  statusPreparacao.textContent = 'Preparação registrada. Nenhuma cobrança foi realizada.';
  oferecerCheckoutSandbox(dados);
}

function abrirPreparacao(pedido) {
  if (ocupado || preparacaoAtual?.carregando || !sessaoServicos || pedido.cliente_usuario_id !== sessaoServicos.usuario || pedido.status !== 'aceita') return;
  formPreparacao.reset(); resultadoPreparacao.replaceChildren(); statusPreparacao.textContent = '';
  const chave = pedido.id + ':' + pedido.atualizado_em;
  preparacaoAtual = {pedido, chave, usuario:sessaoServicos.usuario, tentativa:tentativasPreparacao.get(chave)};
  elemento('pedido-preparacao').textContent = `${pedido.titulo} · ${moeda.format(pedido.valor_centavos / 100)}`;
  if (preparacaoAtual.tentativa) {
    formPreparacao.elements.forma.value = preparacaoAtual.tentativa.forma;
    formPreparacao.elements.parcelas.value = String(preparacaoAtual.tentativa.parcelas);
    if (preparacaoAtual.tentativa.resultado) exibirPreparacao(preparacaoAtual.tentativa.resultado);
    else statusPreparacao.textContent = 'Há uma preparação com resultado incerto. Confira usando as mesmas condições.';
  }
  controlesPreparacao(); mostrar('preparacao');
}

formPreparacao.elements.forma.addEventListener('change', () => {
  formPreparacao.elements.parcelas.value = formPreparacao.elements.forma.value === 'credito_avista' ? '1' : '2';
  controlesPreparacao();
});
formPreparacao.addEventListener('submit', async evento => {
  evento.preventDefault();
  const atual = preparacaoAtual;
  if (ocupado || !atual || atual.carregando || !sessaoServicos || atual.usuario !== sessaoServicos.usuario || atual.tentativa?.resultado) return;
  atual.tentativa ??= Object.freeze({forma:formPreparacao.elements.forma.value, parcelas:Number(formPreparacao.elements.parcelas.value)});
  tentativasPreparacao.set(atual.chave, atual.tentativa);
  const dados = {solicitacaoId:atual.pedido.id, forma:atual.tentativa.forma, parcelas:atual.tentativa.parcelas};
  atual.carregando = true; bloquear(secaoPreparacao, true);
  statusPreparacao.textContent = 'Conferindo orçamento e registrando a preparação…';
  try {
    const resposta = await controleSessao.requisitar(token => enviar('/functions/v1/preparar-pagamento-teste', dados, token));
    if (preparacaoAtual !== atual) return;
    if (resposta.status === 401) {exigirNovoLogin('solicitacoes'); return;}
    if (resposta.status === 409 || resposta.status === 404) {
      statusPreparacao.textContent = 'O orçamento ou as condições mudaram. Atualize as solicitações. Nenhuma cobrança foi realizada.';
      return;
    }
    if (!resposta.ok) throw new Error();
    const registro = validarResultadoPreparacao(await resposta.json(), atual.pedido, atual.tentativa);
    if (preparacaoAtual !== atual) return;
    atual.tentativa = Object.freeze({...atual.tentativa, resultado:registro});
    tentativasPreparacao.set(atual.chave, atual.tentativa);
    exibirPreparacao(registro);
  } catch {
    if (preparacaoAtual === atual) statusPreparacao.textContent = 'Não foi possível confirmar a preparação. Confira novamente com as mesmas condições. Nenhuma cobrança foi iniciada por esta tela.';
  } finally {
    atual.carregando = false;
    if (preparacaoAtual === atual) {bloquear(secaoPreparacao, false); controlesPreparacao();}
  }
});
elemento('voltar-preparacao').addEventListener('click', () => {
  if (!ocupado) proteger('solicitacoes');
});
function oferecerCheckoutSandbox(dados) {
  if (dados.forma !== 'credito_avista' || dados.parcelas !== 1) return;
  const aviso = texto('p', 'Checkout sandbox: use somente dados e cartão fictícios de teste. O valor simulado considera apenas o serviço, sem taxas ou repasse.');
  const botao = texto('button', 'Gerar checkout sandbox');
  botao.type = 'button';
  const pendente = 'Checkout pendente de conferência. A tentativa foi preservada; não gere outro checkout. Volte às solicitações para acompanhar.';
  const status = texto('p', preparacaoAtual?.tentativa?.checkoutIncerto ? pendente : '');
  botao.disabled = Boolean(preparacaoAtual?.tentativa?.checkoutIncerto);
  const preservarIncerteza = atual => {
    atual.tentativa = Object.freeze({...atual.tentativa, checkoutIncerto:true});
    tentativasPreparacao.set(atual.chave, atual.tentativa);
    status.textContent = pendente;
  };
  resultadoPreparacao.append(aviso, botao, status);
  botao.addEventListener('click', async () => {
    const atual = preparacaoAtual;
    if (!atual || atual.carregando || atual.checkoutCriado || atual.tentativa?.checkoutIncerto || atual.usuario !== sessaoServicos?.usuario) return;
    if (!window.confirm('Abrir um checkout no ambiente sandbox do PagBank? Use somente dados fictícios. Não há cobrança real.')) return;
    atual.carregando = true; bloquear(secaoPreparacao, true);
    status.textContent = 'Conferindo a preparação e criando o checkout sandbox…';
    try {
      const r = await controleSessao.requisitar(token => enviar('/functions/v1/criar-checkout-sandbox', {preparacaoId:dados.preparacaoId}, token));
      if (preparacaoAtual !== atual) return;
      if (r.status === 401) {exigirNovoLogin('solicitacoes'); return;}
      if (!r.ok) {
        preservarIncerteza(atual);
        return;
      }
      const c = await r.json();
      if (preparacaoAtual !== atual) return;
      let u;
      try {u = new URL(c.url);} catch {throw new Error();}
      if (c.ambiente !== 'sandbox' || c.pagamentoRealHabilitado !== false || c.repasseHabilitado !== false ||
          !['qa.pagamento.pagseguro.uol.com.br','sandbox.pagamento.pagseguro.uol.com.br','qa.pagamento.pagbank.com.br','sandbox.pagamento.pagbank.com.br'].includes(u.hostname) ||
          u.protocol !== 'https:' || u.port || u.username || u.password || u.hash || u.pathname !== '/pagamento' ||
          [...u.searchParams].length !== 1 || !/^[A-Za-z0-9-]{1,100}$/.test(u.searchParams.get('code') || '')) throw new Error();
      const link = texto('a', 'Abrir PagBank — sandbox');
      link.href = u.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
      status.replaceChildren(texto('p', 'Checkout sandbox pronto. Abrir ou retornar desta página não confirma pagamento.'), link);
      atual.checkoutCriado = true;
    } catch {
      if (preparacaoAtual === atual) preservarIncerteza(atual);
    } finally {
      atual.carregando = false;
      if (preparacaoAtual === atual) {bloquear(secaoPreparacao, false);controlesPreparacao();botao.disabled = Boolean(atual.checkoutCriado || atual.tentativa?.checkoutIncerto);}
    }
  });
}
