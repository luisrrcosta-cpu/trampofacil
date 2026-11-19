'use strict';

const secaoConversa = elemento('conversa');
const formularioMensagem = elemento('form-mensagem');
const statusConversa = elemento('status-conversa');
const statusMensagem = elemento('status-mensagem');
const enviarMensagem = formularioMensagem.querySelector('button[type="submit"]');
const dataConversa = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const tamanhoPaginaConversa = 30;
const conversaEncerrada = (status) => ['concluida', 'cancelada'].includes(status);
let pedidoEmConversa;
let podeEnviarMensagem = false;
let envioIncerto = false;
let rascunhoConversa;

const historico = {
  tabela: 'historico_solicitacoes',
  campos: 'id,criado_em,status,valor_centavos',
  lista: elemento('historico-conversa'),
  mais: elemento('mais-historico'),
  vazio: 'Nenhum evento registrado.',
  renderizar(evento) {
    const item = texto('li', `${dataConversa.format(new Date(evento.criado_em))} · ${nomesStatus[evento.status] ?? evento.status}`);
    if (evento.valor_centavos !== null) {
      item.append(texto('span', ` · ${moeda.format(evento.valor_centavos / 100)}`));
    }
    return item;
  },
};

const mensagens = {
  tabela: 'mensagens_solicitacoes',
  campos: 'id,criado_em,autor_usuario_id,texto',
  lista: elemento('mensagens-conversa'),
  mais: elemento('mais-mensagens'),
  vazio: 'Nenhuma mensagem nesta solicitação.',
  renderizar(mensagem) {
    const item = document.createElement('li');
    const autor = mensagem.autor_usuario_id === sessaoServicos.usuario ? 'Você' : 'Outra parte';
    const corpo = texto('p', mensagem.texto);
    corpo.className = 'texto-mensagem';
    item.append(texto('strong', autor),
      texto('span', ` · ${dataConversa.format(new Date(mensagem.criado_em))}`), corpo);
    return item;
  },
};

function trocarSessaoConversa(sessao, usuarioAnterior) {
  const rascunho = rascunhoConversa;
  const corpo = formularioMensagem.elements.texto.value;
  const incerto = envioIncerto;
  limparConversa();
  if (usuarioAnterior && corpo) {
    rascunhoConversa = { usuario: usuarioAnterior, pedido: pedidoEmConversa, corpo, incerto };
  } else if (rascunho && sessao?.usuario === rascunho.usuario && pedidoEmConversa === rascunho.pedido) {
    formularioMensagem.elements.texto.value = rascunho.corpo;
    envioIncerto = rascunho.incerto;
  }
}

function limparConversa() {
  rascunhoConversa = undefined;
  envioIncerto = false;
  elemento('titulo-conversa').textContent = '';
  statusConversa.textContent = '';
  statusMensagem.textContent = '';
  formularioMensagem.reset();
  formularioMensagem.hidden = true;
  podeEnviarMensagem = false;
  for (const fluxo of [historico, mensagens]) {
    fluxo.lista.replaceChildren();
    fluxo.mais.hidden = true;
    fluxo.cursor = undefined;
  }
}

function abrirConversa(id) {
  if (ocupado) return;
  limparConversa();
  pedidoEmConversa = id;
  proteger('conversa');
}

function apiConversa(fluxo, filtros, dados) {
  const caminho = `/rest/v1/${fluxo.tabela}?${new URLSearchParams(filtros)}`;
  return controleSessao.requisitar((token) =>
    enviar(caminho, dados, token, dados ? 'return=minimal' : undefined,
      dados ? 'POST' : 'GET'));
}

async function lerConversa(resposta) {
  if (resposta.status === 401) {
    exigirNovoLogin('conversa');
    return null;
  }
  if (!resposta.ok) throw new Error();
  return resposta.json();
}

async function carregarPaginaConversa(fluxo, anexar) {
  const filtros = {
    select: fluxo.campos,
    solicitacao_id: `eq.${pedidoEmConversa}`,
    order: 'criado_em.desc,id.desc',
    limit: tamanhoPaginaConversa + 1,
  };
  if (anexar && fluxo.cursor) {
    const { criado_em, id } = fluxo.cursor;
    filtros.or = `(criado_em.lt.${criado_em},and(criado_em.eq.${criado_em},id.lt.${id}))`;
  }
  const registros = await lerConversa(await apiConversa(fluxo, filtros));
  if (!registros) return false;
  const pagina = registros.slice(0, tamanhoPaginaConversa);
  const itens = pagina.map(fluxo.renderizar);
  if (anexar) fluxo.lista.append(...itens);
  else fluxo.lista.replaceChildren(...(itens.length ? itens : [texto('li', fluxo.vazio)]));
  fluxo.cursor = pagina.at(-1);
  fluxo.mais.hidden = registros.length <= tamanhoPaginaConversa;
  return true;
}

async function carregarConversa() {
  if (ocupado || !sessaoServicos || !pedidoEmConversa) return;
  bloquear(secaoConversa, true);
  statusConversa.textContent = 'Carregando…';
  formularioMensagem.hidden = true;
  podeEnviarMensagem = false;
  try {
    const pedidos = await lerConversa(await apiPedidos({
      select: 'titulo,status', id: `eq.${pedidoEmConversa}`, limit: '1',
    }));
    if (!pedidos) return;
    const pedido = pedidos[0];
    if (!pedido) {
      limparConversa();
      statusConversa.textContent = 'Solicitação indisponível.';
      return;
    }
    elemento('titulo-conversa').textContent = pedido.titulo;
    if (!(await carregarPaginaConversa(historico, false))) return;
    if (!(await carregarPaginaConversa(mensagens, false))) return;
    if (envioIncerto) {
      envioIncerto = false;
      statusMensagem.textContent = 'Confira se a mensagem já aparece na conversa antes de reenviar.';
    }
    podeEnviarMensagem = !conversaEncerrada(pedido.status);
    formularioMensagem.hidden = !podeEnviarMensagem;
    statusConversa.textContent = podeEnviarMensagem ? '' : 'Solicitação encerrada. As mensagens continuam disponíveis para leitura.';
  } catch {
    statusConversa.textContent = 'Não foi possível carregar todos os dados. Tente atualizar.';
  } finally {
    bloquear(secaoConversa, false);
    enviarMensagem.disabled = envioIncerto;
  }
}

for (const fluxo of [historico, mensagens]) {
  fluxo.mais.addEventListener('click', async () => {
    if (ocupado || !sessaoServicos) return;
    bloquear(secaoConversa, true);
    try {
      await carregarPaginaConversa(fluxo, true);
    } catch {
      statusConversa.textContent = 'Não foi possível carregar a página anterior. Tente novamente.';
    } finally {
      bloquear(secaoConversa, false);
    enviarMensagem.disabled = envioIncerto;
    }
  });
}

formularioMensagem.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (ocupado || !sessaoServicos || !podeEnviarMensagem || envioIncerto) return;
  const corpo = formularioMensagem.elements.texto.value.trim();
  if (!corpo || corpo.length > 2000) {
    statusMensagem.textContent = 'Escreva uma mensagem de até 2.000 caracteres.';
    return;
  }
  bloquear(secaoConversa, true);
  statusMensagem.textContent = 'Enviando…';
  let atualizar = false;
  try {
    const resposta = await apiConversa(mensagens, {}, { solicitacao_id: pedidoEmConversa, texto: corpo });
    if (resposta.status === 401) {
      exigirNovoLogin('conversa');
      return;
    }
    if (resposta.status === 403) {
      statusMensagem.textContent = 'O envio foi recusado. Confira se a solicitação ainda está aberta.';
      atualizar = true;
    } else if (!resposta.ok) {
      throw new Error();
    } else {
      formularioMensagem.reset();
      statusMensagem.textContent = 'Mensagem enviada.';
      atualizar = true;
    }
  } catch {
    envioIncerto = true;
    statusMensagem.textContent = 'Não foi possível confirmar o envio. Atualize as mensagens antes de tentar novamente.';
  } finally {
    bloquear(secaoConversa, false);
    enviarMensagem.disabled = envioIncerto;
  }
  if (atualizar) await carregarConversa();
});

elemento('atualizar-conversa').addEventListener('click', carregarConversa);
elemento('voltar-solicitacoes').addEventListener('click', () => {
  if (ocupado) return;
  limparConversa();
  pedidoEmConversa = undefined;
  proteger('solicitacoes');
});

