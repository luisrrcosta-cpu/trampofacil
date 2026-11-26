'use strict';

const secaoConversa = elemento('conversa');
const formularioMensagem = elemento('form-mensagem');
const statusConversa = elemento('status-conversa');
const statusMensagem = elemento('status-mensagem');
const contadorMensagem = elemento('contador-mensagem');
function atualizarContadorMensagem() {
  const quantidade = formularioMensagem.elements.texto.value.length;
  contadorMensagem.textContent = `${quantidade}/2000 caracteres`;
}
formularioMensagem.elements.texto.addEventListener('input', atualizarContadorMensagem);
const enviarMensagem = formularioMensagem.querySelector('button[type="submit"]');
const dataConversa = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const tamanhoPaginaConversa = 30;
const conversaEncerrada = (status) => ['concluida', 'cancelada'].includes(status);
let pedidoEmConversa;
let participantesConversa;
let podeEnviarMensagem = false;
let envioIncerto = false;
let rascunhoConversa;
const resumoContratacao = elemento('resumo-contratacao');
function limparResumoContratacao() {
  resumoContratacao.hidden = true;
  elemento('situacao-atual-conversa').textContent = '';
  elemento('orcamento-atual-conversa').textContent = '';
}

const historico = {
  tabela: 'historico_solicitacoes',
  campos: 'id,criado_em,status,valor_centavos',
  lista: elemento('historico-conversa'),
  mais: elemento('mais-historico'),
  vazio: 'Nenhum evento registrado.',
  renderizar(evento) {
    const item = texto('li', `${dataConversa.format(new Date(evento.criado_em))} · ${nomesStatus[evento.status] ?? evento.status}`);
    if (evento.valor_centavos != null) {
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
  const pedido = pedidoEmConversa;
  limparConversa();
  pedidoEmConversa = undefined;
  if (usuarioAnterior && corpo && pedido) {
    rascunhoConversa = { usuario: usuarioAnterior, pedido, corpo, incerto };
  } else if (rascunho) {
    // Manter o rascunho somente na memória, sem exibi-lo a outra conta.
    // A restauração só ocorre ao reabrir o pedido pelo mesmo usuário.
    rascunhoConversa = rascunho;
  }
}

function limparConversa() {
  limparResumoContratacao();
  rascunhoConversa = undefined;
  envioIncerto = false;
  participantesConversa = undefined;
  elemento('titulo-conversa').textContent = '';
  statusConversa.textContent = '';
  statusMensagem.textContent = '';
  formularioMensagem.reset();
  atualizarContadorMensagem();
  formularioMensagem.hidden = true;
  podeEnviarMensagem = false;
  for (const fluxo of [historico, mensagens]) {
    fluxo.lista.replaceChildren();
    fluxo.mais.hidden = true;
    fluxo.cursor = undefined;
  }
}

function abrirConversa(id, sugestao = '') {
  if (ocupado) return;
  if (typeof id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    elemento('status-solicitacoes').textContent = 'Solicitação inválida. Atualize a lista.';
    return;
  }
  if (typeof confirmarSaidaPropostas === 'function' && !confirmarSaidaPropostas()) return;
  const rascunho = rascunhoConversa;
  limparConversa();
  pedidoEmConversa = id;
  if (rascunho?.usuario === sessaoServicos?.usuario && rascunho.pedido === id) {
    formularioMensagem.elements.texto.value = rascunho.corpo;
    atualizarContadorMensagem();
    envioIncerto = rascunho.incerto;
  } else if (sessaoServicos && typeof sugestao === 'string' && sugestao.trim() && sugestao.length <= 2000) {
    // Sugestão só em memória, sem substituir rascunho e sem envio automático.
    formularioMensagem.elements.texto.value = sugestao.trim();
    atualizarContadorMensagem();
    statusMensagem.textContent = 'Revise a mensagem e toque em Enviar mensagem se quiser enviá-la.';
  }
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
  if (!sessaoServicos || typeof pedidoEmConversa !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(pedidoEmConversa)) {
    throw new Error('Identificador da conversa inválido');
  }
  if (anexar && !fluxo.cursor) {
    fluxo.mais.hidden = true;
    return false;
  }
  const sessaoOriginal = sessaoServicos;
  const pedidoOriginal = pedidoEmConversa;
  const filtros = {
    select: fluxo.campos,
    solicitacao_id: `eq.${pedidoEmConversa}`,
    order: 'criado_em.desc,id.desc',
    limit: tamanhoPaginaConversa + 1,
  };
  if (anexar) {
    const { criado_em, id } = fluxo.cursor;
    if (typeof criado_em !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(criado_em) ||
        !Number.isFinite(Date.parse(criado_em)) ||
        typeof id !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      throw new Error('Cursor de conversa inválido');
    }
    filtros.or = `(criado_em.lt.${criado_em},and(criado_em.eq.${criado_em},id.lt.${id}))`;
  }
  const resposta = await apiConversa(fluxo, filtros);
  if (sessaoServicos !== sessaoOriginal || pedidoEmConversa !== pedidoOriginal) return false;
  const registros = await lerConversa(resposta);
  if (!registros || sessaoServicos !== sessaoOriginal || pedidoEmConversa !== pedidoOriginal) return false;
  if (!Array.isArray(registros) || registros.length > tamanhoPaginaConversa + 1 ||
      !registros.every(item => item && typeof item.id === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id) &&
        typeof item.criado_em === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(item.criado_em) &&
        Number.isFinite(Date.parse(item.criado_em)) &&
        (fluxo === historico
          ? Object.prototype.hasOwnProperty.call(nomesStatus, item.status) &&
            (item.valor_centavos == null || (Number.isSafeInteger(item.valor_centavos) &&
              item.valor_centavos >= 100 && item.valor_centavos <= 100000000))
          : typeof item.autor_usuario_id === 'string' &&
            participantesConversa?.has(item.autor_usuario_id.toLowerCase()) &&
            typeof item.texto === 'string' && item.texto.trim().length > 0 &&
            item.texto.length <= 2000))) {
    throw new Error('Resposta de conversa inválida');
  }
  // Compare os instantes com precisão de microssegundos do PostgreSQL.
  // Date.parse arredonda para milissegundos e pode confundir mensagens distintas.
  const chaveTemporal = (valor) => {
    const partes = /^(.{19})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/.exec(valor);
    if (!partes) throw new Error('Data da conversa inválida');
    const segundos = Date.parse(`${partes[1]}${partes[3]}`);
    return BigInt(segundos) * 1000000n +
      BigInt((partes[2] || '').padEnd(6, '0').slice(0, 6));
  };
  // Uma página antiga nunca pode conter registros iguais ou posteriores ao cursor.
  if (anexar && registros.some(item => {
    const instante = chaveTemporal(item.criado_em);
    const limite = chaveTemporal(fluxo.cursor.criado_em);
    return instante > limite ||
      (instante === limite && item.id.toLowerCase() >= fluxo.cursor.id.toLowerCase());
  })) {
    throw new Error('Página da conversa ultrapassou o cursor');
  }
  // O histórico e as mensagens precisam permanecer em ordem decrescente
  // para que o cursor não pule nem repita registros ao buscar páginas antigas.
  for (let indice = 1; indice < registros.length; indice++) {
    const anterior = registros[indice - 1];
    const atual = registros[indice];
    const instanteAnterior = chaveTemporal(anterior.criado_em);
    const instanteAtual = chaveTemporal(atual.criado_em);
    if (instanteAnterior < instanteAtual ||
        (instanteAnterior === instanteAtual &&
          anterior.id.toLowerCase() <= atual.id.toLowerCase())) {
      throw new Error('Ordem de paginação da conversa inválida');
    }
  }
  // O banco pode devolver representações de data diferentes para o mesmo instante.
  // Normalizar a chave evita falsos duplicados e cursores inconsistentes.
  const idsDaPagina = new Set();
  for (const item of registros) {
    const idNormalizado = item.id.toLowerCase();
    if (idsDaPagina.has(idNormalizado)) {
      throw new Error('Página da conversa contém identificadores repetidos');
    }
    idsDaPagina.add(idNormalizado);
  }
  const pagina = registros.slice(0, tamanhoPaginaConversa);
  const idsExibidos = new Set(anexar
    ? Array.from(fluxo.lista.children, item => item.dataset.registroId?.toLowerCase()).filter(Boolean)
    : []);
  const novosRegistros = pagina.filter(item => {
    const idNormalizado = item.id.toLowerCase();
    if (idsExibidos.has(idNormalizado)) return false;
    idsExibidos.add(idNormalizado);
    return true;
  });
  const itens = novosRegistros.map(fluxo.renderizar);
  itens.forEach((item, indice) => { item.dataset.registroId = novosRegistros[indice].id; });
  if (anexar) {
    fluxo.lista.querySelectorAll('li:not([data-registro-id])').forEach(item => item.remove());
    fluxo.lista.append(...itens);
  } else {
    fluxo.lista.replaceChildren(...(itens.length ? itens : [texto('li', fluxo.vazio)]));
  }
  fluxo.cursor = pagina.at(-1);
  fluxo.mais.hidden = registros.length <= tamanhoPaginaConversa ||
    (anexar && novosRegistros.length === 0);
  return true;
}

async function carregarConversa() {
  if (ocupado || !sessaoServicos || !pedidoEmConversa) return;
  const sessaoOriginal = sessaoServicos;
  const pedidoOriginal = pedidoEmConversa;
  bloquear(secaoConversa, true);
  statusConversa.textContent = 'Carregando…';
  limparResumoContratacao();
  formularioMensagem.hidden = true;
  podeEnviarMensagem = false;
  try {
    const resposta = await apiPedidos({
      select: 'id,cliente_usuario_id,profissional_usuario_id,titulo,status,valor_centavos', id: `eq.${pedidoOriginal}`, limit: '1',
    });
    if (sessaoServicos !== sessaoOriginal || pedidoEmConversa !== pedidoOriginal) return;
    const pedidos = await lerConversa(resposta);
    if (!pedidos || sessaoServicos !== sessaoOriginal || pedidoEmConversa !== pedidoOriginal) return;
    if (!Array.isArray(pedidos) || pedidos.length > 1 ||
        !pedidos.every(item => item && typeof item.id === 'string' &&
          item.id.toLowerCase() === pedidoOriginal.toLowerCase() &&
          typeof item.cliente_usuario_id === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.cliente_usuario_id) &&
          typeof item.profissional_usuario_id === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.profissional_usuario_id) &&
          papelNaContratacao(item, sessaoOriginal.usuario) &&
          typeof item.titulo === 'string' &&
          item.titulo.trim().length >= 3 && item.titulo.length <= 120 &&
          Object.prototype.hasOwnProperty.call(nomesStatus, item.status) &&
          (item.valor_centavos == null || (Number.isSafeInteger(item.valor_centavos) && item.valor_centavos >= 100 && item.valor_centavos <= 100000000)))) {
      throw new Error('Resposta de solicitação inválida');
    }
    const pedido = pedidos[0];
    if (!pedido) {
      limparConversa();
      // Conserve só o identificador para permitir nova consulta e liberar
      // os controles no finally da mesma sessão e solicitação.
      statusConversa.textContent = 'Solicitação indisponível.';
      return;
    }
    participantesConversa = new Set([pedido.cliente_usuario_id.toLowerCase(), pedido.profissional_usuario_id.toLowerCase()]);
    elemento('titulo-conversa').textContent = pedido.titulo;
    if (!(await carregarPaginaConversa(historico, false))) return;
    if (!(await carregarPaginaConversa(mensagens, false))) return;
    if (sessaoServicos !== sessaoOriginal || pedidoEmConversa !== pedidoOriginal) return;
    if (envioIncerto) {
      envioIncerto = false;
      statusMensagem.textContent = 'Confira se a mensagem já aparece na conversa antes de reenviar.';
    }
    elemento('situacao-atual-conversa').textContent = 'Situação atual: ' + nomesStatus[pedido.status];
    elemento('orcamento-atual-conversa').textContent = pedido.valor_centavos == null
      ? 'Orçamento ainda não informado.'
      : 'Orçamento atual: ' + moeda.format(pedido.valor_centavos / 100);
    resumoContratacao.hidden = false;
    podeEnviarMensagem = !conversaEncerrada(pedido.status);
    formularioMensagem.hidden = !podeEnviarMensagem;
    statusConversa.textContent = podeEnviarMensagem ? '' : 'Solicitação encerrada. As mensagens continuam disponíveis para leitura.';
  } catch {
    if (sessaoServicos === sessaoOriginal && pedidoEmConversa === pedidoOriginal) {
      // Não mostrar dados parciais nem permitir envio após falha de validação.
      participantesConversa = undefined;
      podeEnviarMensagem = false;
      formularioMensagem.hidden = true;
      for (const fluxo of [historico, mensagens]) {
        fluxo.lista.replaceChildren();
        fluxo.cursor = undefined;
        fluxo.mais.hidden = true;
      }
      statusConversa.textContent = 'Não foi possível carregar todos os dados. Tente atualizar.';
    }
  } finally {
    if (sessaoServicos === sessaoOriginal && pedidoEmConversa === pedidoOriginal) {
      bloquear(secaoConversa, false);
      enviarMensagem.disabled = envioIncerto || !podeEnviarMensagem;
    }
  }
}

for (const fluxo of [historico, mensagens]) {
  fluxo.mais.addEventListener('click', async () => {
    if (ocupado || !sessaoServicos || !pedidoEmConversa) return;
    const sessaoOriginal = sessaoServicos;
    const pedidoOriginal = pedidoEmConversa;
    bloquear(secaoConversa, true);
    try {
      await carregarPaginaConversa(fluxo, true);
    } catch {
      if (sessaoServicos === sessaoOriginal && pedidoEmConversa === pedidoOriginal) {
        statusConversa.textContent = 'Não foi possível carregar a página anterior. Tente novamente.';
      }
    } finally {
      if (sessaoServicos === sessaoOriginal && pedidoEmConversa === pedidoOriginal) {
        bloquear(secaoConversa, false);
        enviarMensagem.disabled = envioIncerto || !podeEnviarMensagem;
      }
    }
  });
}

formularioMensagem.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (ocupado || !sessaoServicos || !podeEnviarMensagem || envioIncerto) return;
  if (!participantesConversa?.has(sessaoServicos.usuario.toLowerCase()) ||
      typeof pedidoEmConversa !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(pedidoEmConversa)) {
    podeEnviarMensagem = false;
    formularioMensagem.hidden = true;
    statusConversa.textContent = 'Não foi possível validar a participação na conversa. Atualize.';
    return;
  }
  const corpo = formularioMensagem.elements.texto.value.trim();
  if (!corpo || corpo.length > 2000) {
    statusMensagem.textContent = 'Escreva uma mensagem de até 2.000 caracteres.';
    return;
  }
  const sessaoOriginal = sessaoServicos;
  const pedidoOriginal = pedidoEmConversa;
  bloquear(secaoConversa, true);
  statusMensagem.textContent = 'Enviando…';
  // A partir do envio, sair da conta pode perder a resposta de uma gravação.
  // Preserve essa incerteza no rascunho até conferir a conversa novamente.
  envioIncerto = true;
  let atualizar = false;
  try {
    const resposta = await apiConversa(mensagens, {}, { solicitacao_id: pedidoOriginal, texto: corpo });
    if (sessaoServicos !== sessaoOriginal || pedidoEmConversa !== pedidoOriginal) return;
    if (resposta.status === 401) {
      exigirNovoLogin('conversa');
      return;
    }
    if (resposta.status === 403) {
      envioIncerto = false;
      statusMensagem.textContent = 'O envio foi recusado. Confira se a solicitação ainda está aberta.';
      atualizar = true;
    } else if (!resposta.ok) {
      throw new Error();
    } else {
      envioIncerto = false;
      formularioMensagem.reset();
      atualizarContadorMensagem();
      statusMensagem.textContent = 'Mensagem enviada.';
      atualizar = true;
    }
  } catch {
    if (sessaoServicos === sessaoOriginal && pedidoEmConversa === pedidoOriginal) {
      envioIncerto = true;
      statusMensagem.textContent = 'Não foi possível confirmar o envio. Atualize as mensagens antes de tentar novamente.';
    }
  } finally {
    if (sessaoServicos === sessaoOriginal && pedidoEmConversa === pedidoOriginal) {
      bloquear(secaoConversa, false);
      enviarMensagem.disabled = envioIncerto || !podeEnviarMensagem;
    }
  }
  if (atualizar && sessaoServicos === sessaoOriginal && pedidoEmConversa === pedidoOriginal) {
    await carregarConversa();
  }
});

elemento('atualizar-conversa').addEventListener('click', carregarConversa);
elemento('voltar-solicitacoes').addEventListener('click', () => {
  if (ocupado) return;
  const pedidoRetorno = pedidoEmConversa;
  const rascunho = sessaoServicos && pedidoEmConversa && formularioMensagem.elements.texto.value
    ? {usuario:sessaoServicos.usuario, pedido:pedidoEmConversa,
      corpo:formularioMensagem.elements.texto.value, incerto:envioIncerto}
    : rascunhoConversa;
  limparConversa();
  rascunhoConversa = rascunho;
  pedidoEmConversa = undefined;
  return retornarParaSolicitacoes(pedidoRetorno);
});

