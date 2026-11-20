'use strict';

let sessaoServicos;
let destinoLogin;
let emailLogin;
let versaoLogin = 0;
let profissionalEscolhido;
let tentativa;
let filtrosBusca;
let paginaBusca = 0;
let versaoBusca = 0;

const elemento = (id) => document.getElementById(id);
const busca = elemento('form-busca');
const listaBusca = elemento('resultados-busca');
const maisProfissionais = elemento('mais-profissionais');
const formularioLogin = elemento('form-entrar');
const formularioCodigo = elemento('form-codigo');
const formularioPedido = elemento('form-solicitacao');
const campoDescricaoPedido = formularioPedido.elements.descricao;
const contadorDescricaoPedido = elemento('contador-descricao');
function atualizarContadorDescricaoPedido() {
  contadorDescricaoPedido.textContent = `${campoDescricaoPedido.value.length}/3000 caracteres`;
}
campoDescricaoPedido.addEventListener('input', atualizarContadorDescricaoPedido);
const modelosSolicitacao = Object.freeze({
  reparo: { titulo: 'Reparo ou manutenção', descricao: 'Preciso de reparo em: [descreva]\nProblema observado: [descreva]\nBairro ou região aproximada: [informe]\nQuando preciso: [informe]' },
  instalacao: { titulo: 'Instalação de equipamento', descricao: 'Preciso instalar: [descreva]\nLocal aproximado: [informe]\nDetalhes do equipamento: [descreva]\nData desejada: [informe]' },
  reforma: { titulo: 'Obra ou reforma', descricao: 'Serviço desejado: [descreva]\nÁrea aproximada e condições: [descreva]\nBairro ou região: [informe]\nPrazo desejado: [informe]' },
  limpeza: { titulo: 'Limpeza ou organização', descricao: 'Tipo de limpeza ou organização: [descreva]\nTamanho aproximado do local: [informe]\nBairro ou região: [informe]\nDia desejado: [informe]' },
  outro: { titulo: 'Solicitação de serviço', descricao: 'O que preciso: [descreva]\nLocal aproximado: [informe]\nInformações importantes: [descreva]\nQuando preciso: [informe]' },
});
const seletorModeloSolicitacao = elemento('modelo-solicitacao');
seletorModeloSolicitacao.addEventListener('change', () => {
  const modelo = modelosSolicitacao[seletorModeloSolicitacao.value];
  if (!modelo) return;
  const titulo = formularioPedido.elements.titulo;
  if ((titulo.value.trim() || campoDescricaoPedido.value.trim()) &&
      !window.confirm('Substituir o título e a descrição já preenchidos pelo modelo?')) {
    seletorModeloSolicitacao.value = '';
    return;
  }
  titulo.value = modelo.titulo;
  campoDescricaoPedido.value = modelo.descricao;
  atualizarContadorDescricaoPedido();
});

const listaPedidos = elemento('lista-solicitacoes');
const maisPedidos = elemento('mais-solicitacoes');
const tamanhoPaginaPedidos = 50;
let cursorPedidos;
let versaoPedidos = 0;
const filtroPedidos = elemento('filtro-solicitacoes');
function aplicarFiltroPedidos() {
  const filtro = filtroPedidos.value;
  let visiveis = 0;
  for (const card of listaPedidos.children) {
    const situacao = card.dataset.status;
    card.hidden = filtro === 'ativas'
      ? situacao === 'concluida' || situacao === 'cancelada'
      : filtro === 'minha_acao'
        ? card.dataset.minhaAcao !== 'sim'
        : filtro !== 'todas' && situacao !== filtro;
    if (!card.hidden) visiveis++;
  }
  const status = elemento('status-solicitacoes');
  if (listaPedidos.childElementCount) {
    status.textContent = visiveis
      ? `${visiveis} solicitação(ões) exibida(s) neste filtro.`
      : 'Nenhuma solicitação neste filtro entre as carregadas.';
  }
}
filtroPedidos.addEventListener('change', aplicarFiltroPedidos);

elemento('menu-servicos').hidden = !integrado;

function iniciarSessao(sessao) {
  limparPreparacao();
  limparPerfil();
  // Rascunhos ficam apenas em memória e só reaparecem para a conta de origem.
  trocarSessaoConversa(sessao, sessaoServicos?.usuario);
  sessaoServicos = sessao;
  controleSessao.alterar(sessao);
  elemento('sair').hidden = !sessao;
  versaoBusca++;
  bloquear(elemento('catalogo'), false);
  elemento('status-busca').textContent = '';
  listaBusca.replaceChildren();
  maisProfissionais.hidden = true;
  filtrosBusca = undefined;
  paginaBusca = 0;
  versaoPedidos++;
  filtroPedidos.value = 'todas';
  elemento('status-solicitacoes').textContent = '';
  bloquear(elemento('solicitacoes'), false);
  listaPedidos.replaceChildren();
  maisPedidos.hidden = true;
  cursorPedidos = undefined;
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
  const buscaAtual = ++versaoBusca;
  const filtrosAtuais = {
    termo_servico: String(filtros.termo_servico ?? '').trim(),
    termo_cidade: String(filtros.termo_cidade ?? '').trim(),
  };
  if (filtrosAtuais.termo_servico.length > 120 || filtrosAtuais.termo_cidade.length > 120) {
    status.textContent = 'Profissão e cidade devem ter no máximo 120 caracteres.';
    return;
  }
  bloquear(elemento('catalogo'), true);
  status.textContent = 'Buscando…';
  if (pagina === 0) {
    // Uma busca nova invalida resultados e paginação anteriores, inclusive se falhar.
    listaBusca.replaceChildren();
    maisProfissionais.hidden = true;
    filtrosBusca = undefined;
    paginaBusca = 0;
  }
  try {
    const resposta = await enviar('/rest/v1/rpc/buscar_profissionais', {
      ...filtrosAtuais, pagina,
    });
    if (buscaAtual !== versaoBusca) return;
    if (!resposta.ok) throw new Error();
    const profissionais = await resposta.json();
    if (buscaAtual !== versaoBusca) return;
    if (!Array.isArray(profissionais) || profissionais.length > 20) {
      throw new Error('Resposta de busca inválida');
    }
    if (!profissionais.every(p => p && typeof p.nome === 'string' &&
      p.nome.trim().length >= 2 && p.nome.length <= 120 &&
      typeof p.servico === 'string' && p.servico.trim().length >= 2 && p.servico.length <= 120 &&
      typeof p.cidade === 'string' && p.cidade.trim().length >= 2 && p.cidade.length <= 120 &&
      (p.descricao == null || (typeof p.descricao === 'string' && p.descricao.length <= 1000)) &&
      typeof p.id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.id))) {
      throw new Error('Profissional inválido na resposta');
    }
    // Uma página repetida não deve duplicar o mesmo profissional na tela.
    const idsExibidos = new Set(Array.from(listaBusca.children, card => card.dataset.profissionalId));
    let novosProfissionais = 0;
    for (const profissional of profissionais) {
      if (idsExibidos.has(profissional.id)) continue;
      idsExibidos.add(profissional.id);
      novosProfissionais++;
      const card = document.createElement('article');
      card.dataset.profissionalId = profissional.id;
      const servico = texto('p', profissional.servico);
      servico.className = 'profissional-servico';
      const local = texto('p', `Atende em: ${profissional.cidade}`);
      local.className = 'profissional-local';
      card.append(texto('h3', profissional.nome), servico, local);
      if (typeof profissional.descricao === 'string' && profissional.descricao.trim()) {
        const descricao = texto('p', profissional.descricao.trim());
        descricao.className = 'profissional-descricao';
        card.append(descricao);
      }
      card.append(botaoAcao('Solicitar serviço', () => {
        if (ocupado) return;
        profissionalEscolhido = profissional;
        tentativa = undefined;
        formularioPedido.reset();
        atualizarContadorDescricaoPedido();
        elemento('status-envio').textContent = '';
        elemento('profissional-escolhido').textContent = `${profissional.nome} · ${profissional.servico}`;
        proteger('nova-solicitacao');
      }));
      listaBusca.append(card);
    }
    filtrosBusca = filtrosAtuais;
    paginaBusca = pagina;
    // Evita um botão infinito se o servidor repetir uma página inteira.
    maisProfissionais.hidden = profissionais.length !== 20 || novosProfissionais === 0;
    status.textContent = novosProfissionais === 0 && pagina > 0
      ? 'Não há novos profissionais nesta página. Tente outra busca.'
      : listaBusca.childElementCount
        ? `${listaBusca.childElementCount} profissional(is) carregado(s).${maisProfissionais.hidden ? '' : ' Use Ver mais para consultar outros resultados.'}`
        : 'Nenhum profissional encontrado. Experimente outra profissão, uma cidade próxima ou limpe os filtros.';
  } catch {
    if (buscaAtual === versaoBusca) {
      status.textContent = pagina > 0
        ? 'Não foi possível carregar mais profissionais. Toque em Ver mais para tentar novamente.'
        : 'A busca falhou. Tente novamente.';
      // Em falhas de paginação, manter os resultados e permitir nova tentativa.
      if (pagina === 0) maisProfissionais.hidden = true;
    }
  } finally {
    // Uma resposta antiga não pode liberar os controles de uma busca mais recente.
    if (buscaAtual === versaoBusca) bloquear(elemento('catalogo'), false);
  }
}

for (const atalho of document.querySelectorAll('[data-servico-popular]')) {
  atalho.addEventListener('click', () => {
    if (ocupado) return;
    busca.elements.servico.value = atalho.dataset.servicoPopular;
    procurar({
      termo_servico: atalho.dataset.servicoPopular,
      termo_cidade: busca.elements.cidade.value.trim(),
    }, 0);
  });
}

busca.addEventListener('submit', (evento) => {
  evento.preventDefault();
  procurar({
    termo_servico: busca.elements.servico.value.trim(),
    termo_cidade: busca.elements.cidade.value.trim(),
  }, 0);
});
maisProfissionais.addEventListener('click', () => {
  if (!filtrosBusca || maisProfissionais.hidden) return;
  procurar(filtrosBusca, paginaBusca + 1);
});

busca.addEventListener('reset', () => {
  versaoBusca++;
  bloquear(elemento('catalogo'), false);
  filtrosBusca = undefined;
  paginaBusca = 0;
  listaBusca.replaceChildren();
  maisProfissionais.hidden = true;
  elemento('status-busca').textContent = 'Filtros limpos. Faça uma nova busca.';
});

function reiniciarLogin() {
  versaoLogin++;
  bloquear(elemento('entrar'), false);
  emailLogin = undefined;
  formularioLogin.reset();
  formularioCodigo.reset();
  formularioLogin.hidden = false;
  formularioCodigo.hidden = true;
  elemento('status-login').textContent = '';
}

function proteger(destino) {
  if (!integrado) return;
  if (!autenticacaoPronta) {
    resultado('Acesso de testes em preparação', avisoAutenticacao);
    return;
  }
  if (!sessaoServicos) {
    destinoLogin = destino;
    reiniciarLogin();
    mostrar('entrar');
    return;
  }
  mostrar(destino);
  if (destino === 'solicitacoes') carregarPedidos();
  if (destino === 'conversa') carregarConversa();
  if (destino === 'perfil') carregarPerfil();
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
        atualizarContadorDescricaoPedido();
  reiniciarLogin();
  destinoLogin = undefined;
  listaBusca.replaceChildren();
  maisProfissionais.hidden = true;
  elemento('status-busca').textContent = '';
  elemento('status-envio').textContent = '';
  mostrar('inicio');
});

async function enviarLogin(evento, verificando) {
  evento.preventDefault();
  if (ocupado || !integrado || (verificando && !emailLogin)) return;
  const email = verificando ? emailLogin : formularioLogin.elements.email.value.trim().toLowerCase();
  const token = formularioCodigo.elements.token.value;
  const secao = elemento('entrar');
  const status = elemento('status-login');
  if (!autenticacaoPronta) {
    status.textContent = avisoAutenticacao;
    return;
  }
  let autenticado = false;
  const loginAtual = ++versaoLogin;
  bloquear(secao, true);
  try {
    const resposta = verificando
      ? await enviar('/auth/v1/verify', { email, token, type: 'email' })
      : await enviar('/auth/v1/otp', { email, create_user: false });
    if (loginAtual !== versaoLogin) return;
    if (!resposta.ok) throw new Error();
    if (verificando) {
      const { access_token, user } = await resposta.json();
      if (loginAtual !== versaoLogin) return;
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
    if (loginAtual !== versaoLogin) return;
    status.textContent = verificando
      ? 'Código inválido ou expirado. Confira o código ou solicite outro.'
      : 'Não foi possível enviar o código. Confira o e-mail e tente novamente.';
  } finally {
    // Uma tentativa cancelada não pode liberar os controles de outro login.
    if (loginAtual === versaoLogin) bloquear(secao, false);
  }
  if (autenticado) proteger(destinoLogin);
}

formularioLogin.addEventListener('submit', (evento) => enviarLogin(evento, false));
formularioCodigo.addEventListener('submit', (evento) => enviarLogin(evento, true));

function apiPedidos(filtros, dados, metodo) {
  return controleSessao.requisitar((token) =>
    enviar(`/rest/v1/solicitacoes?${new URLSearchParams(filtros)}`, dados,
      token, metodo ? 'return=representation' : undefined, metodo || 'GET'));
}

function exigirNovoLogin(destino) {
  iniciarSessao(undefined);
  // A troca de sessão fecha a conversa. Reabrir pela lista autorizada evita
  // uma tela vazia e conserva o rascunho apenas para o titular e pedido originais.
  proteger(destino === 'conversa' ? 'solicitacoes' : destino);
  elemento('status-login').textContent = 'Sua sessão expirou. Entre novamente para continuar.';
}

formularioPedido.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (ocupado || !sessaoServicos || !profissionalEscolhido) return;
  const titulo = formularioPedido.elements.titulo.value.trim();
  const descricao = formularioPedido.elements.descricao.value.trim();
  const secao = elemento('nova-solicitacao');
  const status = elemento('status-envio');
  if (titulo.length < 3 || titulo.length > 120 || descricao.length < 10 || descricao.length > 3000) {
    status.textContent = 'Informe um título de 3 a 120 caracteres e uma descrição de 10 a 3.000 caracteres.';
    return;
  }
  if (/\\[(?:descreva|informe)\\]/i.test(descricao)) {
    status.textContent = 'Complete os campos entre colchetes do modelo antes de enviar.';
    return;
  }
  if (typeof profissionalEscolhido.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(profissionalEscolhido.id)) {
    status.textContent = 'Profissional inválido. Volte à busca e escolha novamente.';
    return;
  }
  const sessaoOriginal = sessaoServicos;
  const profissionalOriginal = profissionalEscolhido;
  const dados = {
    cliente_usuario_id: sessaoOriginal.usuario,
    profissional_id: profissionalOriginal.id, titulo, descricao,
  };
  const chave = JSON.stringify(dados);
  if (tentativa?.chave !== chave) tentativa = { chave, id: crypto.randomUUID() };
  const { id } = tentativa;
  bloquear(secao, true);
  status.textContent = 'Enviando…';
  let salvo = false;
  try {
    const resposta = await apiPedidos({ select: 'id' }, { id, ...dados }, 'POST');
    if (sessaoServicos !== sessaoOriginal || profissionalEscolhido !== profissionalOriginal) return;
    if (resposta.status === 401) {
      exigirNovoLogin('nova-solicitacao');
      return;
    }
    salvo = resposta.ok;
    if (resposta.status === 409) {
      const anterior = await apiPedidos({
        select: 'id,titulo,descricao', id: `eq.${id}`,
        cliente_usuario_id: `eq.${dados.cliente_usuario_id}`,
        profissional_id: `eq.${dados.profissional_id}`,
      });
      if (anterior.status === 401) {
        if (sessaoServicos === sessaoOriginal) exigirNovoLogin('nova-solicitacao');
        return;
      }
      const registros = anterior.ok ? await anterior.json() : [];
      if (sessaoServicos !== sessaoOriginal || profissionalEscolhido !== profissionalOriginal) return;
      salvo = Array.isArray(registros) && registros.length === 1
        && registros[0].titulo === titulo && registros[0].descricao === descricao;
    }
    if (!salvo) {
      status.textContent = resposta.status === 403
        ? 'Complete seu cadastro de cliente e escolha um profissional disponível que não seja você.'
        : 'Não foi possível enviar a solicitação. Tente novamente.';
    }
  } catch {
    if (sessaoServicos === sessaoOriginal && profissionalEscolhido === profissionalOriginal) {
      status.textContent = 'Não foi possível confirmar o envio. Tente novamente.';
    }
  } finally {
    bloquear(secao, false);
  }
  if (salvo && sessaoServicos === sessaoOriginal && profissionalEscolhido === profissionalOriginal) {
    tentativa = undefined;
    formularioPedido.reset();
        atualizarContadorDescricaoPedido();
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
const proximosPassos = Object.freeze({
  solicitada: 'Aguardando orçamento do profissional.',
  proposta: 'Aguardando o cliente aceitar ou recusar o orçamento.',
  aceita: 'Orçamento aceito. Aguardando o profissional iniciar o serviço.',
  em_andamento: 'Serviço em andamento. O profissional avisará quando entregar.',
  entregue: 'Serviço entregue. Aguardando confirmação de conclusão pelo cliente.',
  concluida: 'Serviço concluído. Pagamento e repasse ainda não são processados pelo aplicativo.',
  cancelada: 'Solicitação cancelada. Não há reembolso automático.',
});

function mostrarPedido(pedido) {
  const papel = papelNaContratacao(pedido, sessaoServicos?.usuario);
  const card = document.createElement('article');
  if (!papel) {
    card.append(texto('p', 'Solicitação indisponível para esta conta. Atualize a lista.'));
    return card;
  }
  card.dataset.status = pedido.status;
  const cliente = pedido.cliente_usuario_id === sessaoServicos.usuario;
  card.dataset.minhaAcao = (
    (cliente && ['proposta', 'entregue'].includes(pedido.status)) ||
    (!cliente && ['solicitada', 'aceita', 'em_andamento'].includes(pedido.status))
  ) ? 'sim' : 'nao';
  card.append(texto('h3', pedido.titulo), texto('p', pedido.descricao),
    texto('p', `${cliente ? 'Enviada' : 'Recebida'} · ${nomesStatus[pedido.status] ?? pedido.status}`));
  if (Object.prototype.hasOwnProperty.call(proximosPassos, pedido.status)) {
    card.append(texto('p', proximosPassos[pedido.status]));
  }
  if (Number.isSafeInteger(pedido.valor_centavos) && pedido.valor_centavos >= 100) {
    const comissao = Math.floor((pedido.valor_centavos + 5) / 10);
    const repasse = pedido.valor_centavos - comissao;
    card.append(texto('p', `Valor proposto: ${moeda.format(pedido.valor_centavos / 100)}`));
    card.append(texto('p', `Divisão prevista: profissional ${moeda.format(repasse / 100)} (90%) · TrampoFácil ${moeda.format(comissao / 100)} (10%). Valores antes de impostos e taxas aplicáveis; nenhum pagamento foi processado.`));
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
    if (pedido.status === 'proposta' && Number.isSafeInteger(pedido.valor_centavos)) {
      campo.value = (pedido.valor_centavos / 100).toFixed(2);
    }
    label.append(campo);
    const erro = texto('p', '');
    erro.setAttribute('role', 'alert');
    if (pedido.status === 'proposta') {
      form.append(texto('p', 'Alterar o valor substitui a proposta anterior. O cliente deverá aceitar o orçamento atualizado.'));
    }
    form.append(label, erro, texto('button', pedido.status === 'proposta' ? 'Atualizar proposta' : 'Enviar proposta'));
    form.addEventListener('submit', (evento) => {
      evento.preventDefault();
      erro.textContent = '';
      try {
        const valor_centavos = propostaEmCentavos(campo.value);
        const valor = moeda.format(valor_centavos / 100);
        if (window.confirm(`Enviar proposta de ${valor} para este serviço? O cliente precisará aceitar o orçamento. Nenhum pagamento será realizado agora.`)) {
          atualizarPedido(pedido, { status: 'proposta', valor_centavos });
        }
      } catch (falha) {
        erro.textContent = falha.message;
      }
    });
    card.append(form);
  }
  if (cliente && pedido.status === 'proposta') {
    card.append(botaoAcao('Aceitar proposta', () => {
      if (!Number.isSafeInteger(pedido.valor_centavos) || pedido.valor_centavos < 100) {
        elemento('status-solicitacoes').textContent = 'Proposta sem valor válido. Atualize a lista antes de aceitar.';
        return;
      }
      const valor = moeda.format(pedido.valor_centavos / 100);
      if (window.confirm(`Aceitar o orçamento de ${valor} para este serviço? Esta ação não realiza pagamento nem reserva dinheiro. O pagamento online ainda não está disponível.`)) {
        atualizarPedido(pedido, { status: 'aceita' });
      }
    }));
  }
  if (cliente && pedido.status === 'aceita') card.append(
    botaoAcao('Preparar pagamento de teste', () => abrirPreparacao(pedido)),
  );
  if (!cliente && pedido.status === 'aceita') {
    card.append(botaoAcao('Iniciar serviço', () => {
      if (window.confirm('Confirmar o início do serviço? O cliente poderá acompanhar o andamento.')) {
        atualizarPedido(pedido, { status: 'em_andamento' });
      }
    }));
  }
  if (!cliente && pedido.status === 'em_andamento') {
    card.append(botaoAcao('Marcar como entregue', () => {
      if (window.confirm('O serviço foi realmente entregue? O cliente precisará confirmar a conclusão. Esta etapa não confirma pagamento nem repasse.')) {
        atualizarPedido(pedido, { status: 'entregue' });
      }
    }));
  }
  if (cliente && pedido.status === 'entregue') {
    card.append(botaoAcao('Concluir serviço', () => {
      if (window.confirm('Confirmar que o serviço foi entregue e concluído? Isso encerra a solicitação e não representa pagamento ao profissional.')) {
        atualizarPedido(pedido, { status: 'concluida' });
      }
    }));
  }
  if (['solicitada', 'proposta', 'aceita'].includes(pedido.status)) {
    card.append(botaoAcao('Cancelar solicitação', () => {
      const aviso = pedido.status === 'aceita'
        ? 'Esta contratação já foi aceita. Deseja cancelar a solicitação? Avise a outra parte pelas mensagens, se necessário. Nenhum estorno ou reembolso será realizado automaticamente.'
        : 'Deseja cancelar esta solicitação? Esta ação encerra a negociação e não realiza pagamentos nem estornos.';
      if (window.confirm(aviso)) {
        atualizarPedido(pedido, { status: 'cancelada' });
      }
    }));
  }
  card.append(botaoAcao('Ver histórico e mensagens', () => abrirConversa(pedido.id)));
  return card;
}

async function carregarPedidos(aviso = '', anexar = false) {
  if (ocupado || !sessaoServicos || (anexar && !cursorPedidos)) return;
  const secao = elemento('solicitacoes');
  const status = elemento('status-solicitacoes');
  const sessaoDaBusca = sessaoServicos;
  const pedidosAtuais = ++versaoPedidos;
  bloquear(secao, true);
  status.textContent = 'Carregando…';
  try {
    const filtros = {
      select: 'id,cliente_usuario_id,titulo,descricao,status,valor_centavos,atualizado_em',
      order: 'atualizado_em.desc,id.desc', limit: tamanhoPaginaPedidos + 1,
    };
    if (anexar) {
      const { atualizado_em, id } = cursorPedidos;
      filtros.or = `(atualizado_em.lt.${atualizado_em},and(atualizado_em.eq.${atualizado_em},id.lt.${id}))`;
    }
    const resposta = await apiPedidos(filtros);
    if (sessaoServicos !== sessaoDaBusca || pedidosAtuais !== versaoPedidos) return;
    if (resposta.status === 401) {
      exigirNovoLogin('solicitacoes');
      return;
    }
    if (!resposta.ok) throw new Error();
    const pedidos = await resposta.json();
    if (!Array.isArray(pedidos) || pedidos.length > tamanhoPaginaPedidos + 1 ||
      !pedidos.every(p => p && typeof p.id === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.id) &&
        typeof p.atualizado_em === 'string' && !Number.isNaN(Date.parse(p.atualizado_em)) &&
        typeof p.cliente_usuario_id === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.cliente_usuario_id) &&
        typeof p.titulo === 'string' && p.titulo.trim().length >= 3 && p.titulo.length <= 120 &&
        typeof p.descricao === 'string' && p.descricao.trim().length >= 10 && p.descricao.length <= 3000 &&
        Object.prototype.hasOwnProperty.call(nomesStatus, p.status) &&
        (p.valor_centavos == null || (Number.isSafeInteger(p.valor_centavos) &&
          p.valor_centavos >= 100 && p.valor_centavos <= 100000000)))) {
      throw new Error('Resposta de solicitações inválida');
    }
    // Nunca renderizar dados de uma requisição iniciada em outra sessão ou busca.
    if (sessaoServicos !== sessaoDaBusca || pedidosAtuais !== versaoPedidos) return;
    const pagina = pedidos.slice(0, tamanhoPaginaPedidos);
    const idsExibidos = new Set(anexar
      ? Array.from(listaPedidos.children, card => card.dataset.solicitacaoId)
      : []);
    const novosPedidos = pagina.filter(p => {
      if (idsExibidos.has(p.id)) return false;
      idsExibidos.add(p.id);
      return true;
    });
    const cards = novosPedidos.map(mostrarPedido);
    cards.forEach((card, i) => { card.dataset.solicitacaoId = novosPedidos[i].id; });
    if (anexar) listaPedidos.append(...cards);
    else listaPedidos.replaceChildren(...cards);
    cursorPedidos = pagina.at(-1);
    // Uma página repetida não deve manter o botão de paginação indefinidamente.
    maisPedidos.hidden = pedidos.length <= tamanhoPaginaPedidos || (anexar && novosPedidos.length === 0);
    status.textContent = aviso || (anexar && novosPedidos.length === 0
      ? 'Não há novas solicitações nesta página.'
      : listaPedidos.childElementCount
        ? `${listaPedidos.childElementCount} solicitações carregadas.`
        : 'Nenhuma solicitação encontrada.');
    aplicarFiltroPedidos();
    if (aviso) status.textContent = aviso;
  } catch {
    if (sessaoServicos === sessaoDaBusca && pedidosAtuais === versaoPedidos) {
      status.textContent = anexar
        ? 'Não foi possível carregar as solicitações anteriores. Tente novamente.'
        : 'Não foi possível carregar as solicitações. Tente atualizar.';
    }
  } finally {
    if (sessaoServicos === sessaoDaBusca && pedidosAtuais === versaoPedidos) bloquear(secao, false);
  }
}

async function atualizarPedido(pedido, dados) {
  if (ocupado || !sessaoServicos) return;
  const papel = papelNaContratacao(pedido, sessaoServicos.usuario);
  if (!podeMudarContratacao(pedido.status, dados.status, papel)) {
    elemento('status-solicitacoes').textContent = 'Esta ação não está disponível para sua função ou para o estado atual do serviço.';
    return;
  }
  const sessaoOriginal = sessaoServicos;
  const secao = elemento('solicitacoes');
  const status = elemento('status-solicitacoes');
  bloquear(secao, true);
  status.textContent = 'Atualizando…';
  let aviso;
  try {
    const resposta = await apiPedidos({
      select: 'id', id: `eq.${pedido.id}`,
      atualizado_em: `eq.${pedido.atualizado_em}`,
      status: `eq.${pedido.status}`,
      ...(pedido.status === 'proposta' && dados.status === 'aceita'
        ? { valor_centavos: `eq.${pedido.valor_centavos}` }
        : {}),
    }, dados, 'PATCH');
    if (sessaoServicos !== sessaoOriginal) return;
    if (resposta.status === 401) {
      exigirNovoLogin('solicitacoes');
      return;
    }
    if (resposta.status === 403) {
      aviso = 'Alteração recusada. Somente a parte autorizada pode executar esta etapa, e o serviço precisa estar no estado correto.';
    } else if (resposta.status === 409 || resposta.status === 412) {
      aviso = 'A solicitação foi alterada por outra pessoa. Confira o estado atual antes de tentar novamente.';
    } else if (!resposta.ok) {
      throw new Error();
    } else {
      const registros = await resposta.json();
      if (sessaoServicos !== sessaoOriginal) return;
      if (!Array.isArray(registros) || registros.length > 1 ||
        !registros.every(registro => registro && registro.id === pedido.id)) {
        throw new Error('Resposta de atualização inválida');
      }
      aviso = registros.length
        ? 'Solicitação atualizada.'
        : 'A solicitação mudou. Confira o estado atual antes de repetir a ação.';
    }
  } catch {
    if (sessaoServicos === sessaoOriginal) {
      aviso = 'Não foi possível confirmar a alteração. Confira o estado atual.';
    }
  } finally {
    // Não liberar controles de uma conta diferente após uma resposta atrasada.
    if (sessaoServicos === sessaoOriginal) bloquear(secao, false);
  }
  if (sessaoServicos === sessaoOriginal) await carregarPedidos(aviso);
}

elemento('recarregar-solicitacoes').addEventListener('click', () => carregarPedidos());

maisPedidos.addEventListener('click', () => carregarPedidos('', true));

