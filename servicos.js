'use strict';

let sessaoServicos;
let destinoLogin;
let emailLogin;
let profissionalEscolhido;
let tentativa;
let filtrosBusca;
let paginaBusca = 0;

const elemento = (id) => document.getElementById(id);
const busca = elemento('form-busca');
const listaBusca = elemento('resultados-busca');
const maisProfissionais = elemento('mais-profissionais');
const formularioLogin = elemento('form-entrar');
const formularioCodigo = elemento('form-codigo');
const formularioPedido = elemento('form-solicitacao');
const listaPedidos = elemento('lista-solicitacoes');

elemento('menu-servicos').hidden = !integrado;

function iniciarSessao(sessao, preservarRascunho = false) {
  trocarSessaoConversa(sessao, preservarRascunho ? sessaoServicos?.usuario : undefined);
  sessaoServicos = sessao;
  elemento('sair').hidden = !sessao;
  listaPedidos.replaceChildren();
}

function texto(tag, valor) {
  const item = document.createElement(tag);
  item.textContent = valor;
  return item;
}

function botaoAcao(rotulo, acao) {
  const botao = texto('button', rotulo);
  botao.type = 'button';
  botao.addEventListener('click', acao);
  return botao;
}

async function procurar(filtros, pagina) {
  if (!integrado || ocupado) return;
  const status = elemento('status-busca');
  bloquear(elemento('catalogo'), true);
  status.textContent = 'Buscando…';
  try {
    const resposta = await enviar('/rest/v1/rpc/buscar_profissionais', {
      ...filtros, pagina,
    });
    if (!resposta.ok) throw new Error();
    const profissionais = await resposta.json();
    if (pagina === 0) listaBusca.replaceChildren();
    for (const profissional of profissionais) {
      const card = document.createElement('article');
      card.append(
        texto('h3', profissional.nome),
        texto('p', `${profissional.servico} · ${profissional.cidade}`),
      );
      if (profissional.descricao) card.append(texto('p', profissional.descricao));
      card.append(botaoAcao('Solicitar serviço', () => {
        if (ocupado) return;
        profissionalEscolhido = profissional;
        tentativa = undefined;
        formularioPedido.reset();
        elemento('status-envio').textContent = '';
        elemento('profissional-escolhido').textContent = `${profissional.nome} · ${profissional.servico}`;
        proteger('nova-solicitacao');
      }));
      listaBusca.append(card);
    }
    filtrosBusca = filtros;
    paginaBusca = pagina;
    maisProfissionais.hidden = profissionais.length !== 20;
    status.textContent = listaBusca.childElementCount
      ? `${listaBusca.childElementCount} profissional(is) encontrado(s).`
      : 'Nenhum profissional encontrado.';
  } catch {
    status.textContent = 'A busca falhou. Tente novamente.';
  } finally {
    bloquear(elemento('catalogo'), false);
  }
}

busca.addEventListener('submit', (evento) => {
  evento.preventDefault();
  procurar({
    termo_servico: busca.elements.servico.value.trim(),
    termo_cidade: busca.elements.cidade.value.trim(),
  }, 0);
});
maisProfissionais.addEventListener('click', () => procurar(filtrosBusca, paginaBusca + 1));

function reiniciarLogin() {
  emailLogin = undefined;
  formularioLogin.reset();
  formularioCodigo.reset();
  formularioLogin.hidden = false;
  formularioCodigo.hidden = true;
  elemento('status-login').textContent = '';
}

function proteger(destino) {
  if (!integrado) return;
  if (!sessaoServicos) {
    destinoLogin = destino;
    reiniciarLogin();
    mostrar('entrar');
    return;
  }
  mostrar(destino);
  if (destino === 'solicitacoes') carregarPedidos();
  if (destino === 'conversa') carregarConversa();
}

elemento('abrir-solicitacoes').addEventListener('click', () => proteger('solicitacoes'));
elemento('trocar-email').addEventListener('click', reiniciarLogin);
elemento('cancelar-login').addEventListener('click', () => {
  reiniciarLogin();
  limparConversa();
  mostrar(destinoLogin === 'nova-solicitacao' ? 'catalogo' : 'inicio');
});
elemento('sair').addEventListener('click', () => {
  iniciarSessao(undefined);
  tentativa = undefined;
  profissionalEscolhido = undefined;
  formularioPedido.reset();
  reiniciarLogin();
});

async function enviarLogin(evento, verificando) {
  evento.preventDefault();
  if (ocupado || !integrado || (verificando && !emailLogin)) return;
  const email = verificando ? emailLogin : formularioLogin.elements.email.value.trim().toLowerCase();
  const token = formularioCodigo.elements.token.value;
  const secao = elemento('entrar');
  const status = elemento('status-login');
  let autenticado = false;
  bloquear(secao, true);
  try {
    const resposta = verificando
      ? await enviar('/auth/v1/verify', { email, token, type: 'email' })
      : await enviar('/auth/v1/otp', { email, create_user: false });
    if (!resposta.ok) throw new Error();
    if (verificando) {
      const { access_token, user } = await resposta.json();
      if (!access_token || !user?.id) throw new Error();
      iniciarSessao({ token: access_token, usuario: user.id });
      reiniciarLogin();
      autenticado = true;
    } else {
      emailLogin = email;
      formularioLogin.reset();
      formularioLogin.hidden = true;
      formularioCodigo.hidden = false;
      status.textContent = 'Confira sua caixa de entrada e digite o código de acesso.';
    }
  } catch {
    status.textContent = verificando
      ? 'Código inválido ou expirado. Confira o código ou solicite outro.'
      : 'Não foi possível enviar o código. Confira o e-mail e tente novamente.';
  } finally {
    bloquear(secao, false);
  }
  if (autenticado) proteger(destinoLogin);
}

formularioLogin.addEventListener('submit', (evento) => enviarLogin(evento, false));
formularioCodigo.addEventListener('submit', (evento) => enviarLogin(evento, true));

function apiPedidos(filtros, dados, metodo) {
  return enviar(`/rest/v1/solicitacoes?${new URLSearchParams(filtros)}`, dados,
    sessaoServicos.token, metodo ? 'return=representation' : undefined, metodo || 'GET');
}

function exigirNovoLogin(destino) {
  iniciarSessao(undefined, destino === 'conversa');
  proteger(destino);
  elemento('status-login').textContent = 'Sua sessão expirou. Entre novamente para continuar.';
}

formularioPedido.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (ocupado || !sessaoServicos || !profissionalEscolhido) return;
  const titulo = formularioPedido.elements.titulo.value.trim();
  const descricao = formularioPedido.elements.descricao.value.trim();
  const secao = elemento('nova-solicitacao');
  const status = elemento('status-envio');
  if (titulo.length < 3 || descricao.length < 10) {
    status.textContent = 'Informe um título com 3 caracteres e uma descrição com 10 caracteres ou mais.';
    return;
  }
  const dados = {
    cliente_usuario_id: sessaoServicos.usuario,
    profissional_id: profissionalEscolhido.id, titulo, descricao,
  };
  const chave = JSON.stringify(dados);
  if (tentativa?.chave !== chave) tentativa = { chave, id: crypto.randomUUID() };
  const { id } = tentativa;
  bloquear(secao, true);
  status.textContent = 'Enviando…';
  let salvo = false;
  try {
    const resposta = await apiPedidos({ select: 'id' }, { id, ...dados }, 'POST');
    if (resposta.status === 401) {
      exigirNovoLogin('nova-solicitacao');
      return;
    }
    salvo = resposta.ok;
    if (resposta.status === 409) {
      const anterior = await apiPedidos({
        select: 'id', id: `eq.${id}`,
        cliente_usuario_id: `eq.${dados.cliente_usuario_id}`,
        profissional_id: `eq.${dados.profissional_id}`,
      });
      salvo = anterior.ok && (await anterior.json()).length === 1;
    }
    if (!salvo) {
      status.textContent = resposta.status === 403
        ? 'Complete seu cadastro de cliente e escolha um profissional disponível que não seja você.'
        : 'Não foi possível enviar a solicitação. Tente novamente.';
    }
  } catch {
    status.textContent = 'Não foi possível confirmar o envio. Tente novamente.';
  } finally {
    bloquear(secao, false);
  }
  if (salvo) {
    tentativa = undefined;
    formularioPedido.reset();
    status.textContent = '';
    proteger('solicitacoes');
  }
});

const nomesStatus = {
  solicitada: 'Solicitada', proposta: 'Proposta enviada', aceita: 'Aceita',
  em_andamento: 'Em andamento', entregue: 'Entregue', concluida: 'Concluída',
  cancelada: 'Cancelada',
};
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function mostrarPedido(pedido) {
  const card = document.createElement('article');
  const cliente = pedido.cliente_usuario_id === sessaoServicos.usuario;
  card.append(texto('h3', pedido.titulo), texto('p', pedido.descricao),
    texto('p', `${cliente ? 'Enviada' : 'Recebida'} · ${nomesStatus[pedido.status] ?? pedido.status}`));
  if (pedido.valor_centavos !== null) {
    card.append(texto('p', `Valor proposto: ${moeda.format(pedido.valor_centavos / 100)}`));
  }

  const acao = (rotulo, status) => card.append(
    botaoAcao(rotulo, () => atualizarPedido(pedido, { status })),
  );
  if (!cliente && ['solicitada', 'proposta'].includes(pedido.status)) {
    const form = document.createElement('form');
    const label = texto('label', 'Valor da proposta (R$)');
    const campo = document.createElement('input');
    campo.type = 'number';
    campo.min = '1';
    campo.max = '1000000';
    campo.step = '0.01';
    campo.required = true;
    label.append(campo);
    form.append(label, texto('button', 'Enviar proposta'));
    form.addEventListener('submit', (evento) => {
      evento.preventDefault();
      atualizarPedido(pedido, { status: 'proposta', valor_centavos: Math.round(campo.valueAsNumber * 100) });
    });
    card.append(form);
  }
  if (cliente && pedido.status === 'proposta') acao('Aceitar proposta', 'aceita');
  if (!cliente && pedido.status === 'aceita') acao('Iniciar serviço', 'em_andamento');
  if (!cliente && pedido.status === 'em_andamento') acao('Marcar como entregue', 'entregue');
  if (cliente && pedido.status === 'entregue') acao('Concluir serviço', 'concluida');
  if (['solicitada', 'proposta', 'aceita'].includes(pedido.status)) {
    card.append(botaoAcao('Cancelar solicitação', () => {
      if (window.confirm('Cancelar esta solicitação de serviço?')) {
        atualizarPedido(pedido, { status: 'cancelada' });
      }
    }));
  }
  card.append(botaoAcao('Ver histórico e mensagens', () => abrirConversa(pedido.id)));
  return card;
}

async function carregarPedidos(aviso = '') {
  if (ocupado || !sessaoServicos) return;
  const secao = elemento('solicitacoes');
  const status = elemento('status-solicitacoes');
  bloquear(secao, true);
  status.textContent = 'Carregando…';
  try {
    const resposta = await apiPedidos({
      select: 'id,cliente_usuario_id,titulo,descricao,status,valor_centavos,atualizado_em',
      order: 'atualizado_em.desc,id.desc', limit: '50',
    });
    if (resposta.status === 401) {
      exigirNovoLogin('solicitacoes');
      return;
    }
    if (!resposta.ok) throw new Error();
    const pedidos = await resposta.json();
    listaPedidos.replaceChildren(...pedidos.map(mostrarPedido));
    status.textContent = aviso || (pedidos.length
      ? 'Exibindo as 50 solicitações mais recentes, quando disponíveis.'
      : 'Nenhuma solicitação encontrada.');
  } catch {
    status.textContent = 'Não foi possível carregar as solicitações. Tente atualizar.';
  } finally {
    bloquear(secao, false);
  }
}

async function atualizarPedido(pedido, dados) {
  if (ocupado || !sessaoServicos) return;
  const secao = elemento('solicitacoes');
  const status = elemento('status-solicitacoes');
  bloquear(secao, true);
  status.textContent = 'Atualizando…';
  let aviso;
  try {
    const resposta = await apiPedidos({
      select: 'id', id: `eq.${pedido.id}`,
      atualizado_em: `eq.${pedido.atualizado_em}`,
    }, dados, 'PATCH');
    if (resposta.status === 401) {
      exigirNovoLogin('solicitacoes');
      return;
    }
    if (!resposta.ok) throw new Error();
    aviso = (await resposta.json()).length
      ? 'Solicitação atualizada.'
      : 'A solicitação mudou. Confira o estado atual antes de repetir a ação.';
  } catch {
    aviso = 'Não foi possível confirmar a alteração. Confira o estado atual.';
  } finally {
    bloquear(secao, false);
  }
  await carregarPedidos(aviso);
}

elemento('recarregar-solicitacoes').addEventListener('click', () => carregarPedidos());
