'use strict';

const config = window.TRAMPOFACIL_SUPABASE;
const { integrado, autenticacaoPronta } = validarAmbiente(config);
const avisoAutenticacao = 'O acesso por e-mail está em preparação neste ambiente de testes. A busca e o simulador continuam disponíveis.';
const tabelas = { cliente: 'clientes', profissional: 'profissionais' };
const confirmacao = document.querySelector('#form-confirmacao');
let pendente;
let ocupado = false;

document.querySelector('#aviso-demo').hidden = integrado;
document.querySelector('#aviso-homologacao').hidden = !integrado;
document.querySelector('#aviso-autenticacao').hidden = !integrado || autenticacaoPronta;

function mostrar(id) {
  for (const secao of document.querySelectorAll('main section')) {
    secao.hidden = secao.id !== id;
  }
  const titulo = document.querySelector(`#${id} h2`);
  titulo.tabIndex = -1;
  titulo.focus();
  window.scrollTo(0, 0);
}

function bloquear(secao, estado) {
  ocupado = estado;
  for (const campo of secao.querySelectorAll('input, textarea, button')) {
    campo.disabled = estado;
  }
}

function resultado(titulo, mensagem) {
  document.querySelector('#titulo-resultado').textContent = titulo;
  document.querySelector('#mensagem').textContent = mensagem;
  mostrar('resultado');
}

function lerPerfil(formulario, tipo) {
  const dados = new FormData(formulario);
  const ler = (campo) => dados.get(campo).trim();
  const email = ler('email').toLowerCase();
  const telefone = ler('telefone').replace(/[\s().-]/g, '');
  const perfil = { nome: ler('nome'), cidade: ler('cidade'), telefone };

  if (perfil.nome.length < 2 || perfil.cidade.length < 2) {
    throw new Error('Informe um nome e uma cidade válidos.');
  }
  if (!/^\+?[0-9]{10,15}$/.test(telefone)) {
    throw new Error('Informe um WhatsApp válido com DDD.');
  }
  if (tipo === 'cliente') {
    perfil.email = email;
  } else {
    perfil.servico = ler('servico');
    perfil.descricao = ler('descricao') || null;
    if (perfil.servico.length < 2) {
      throw new Error('Informe o serviço que você oferece.');
    }
  }
  return { email, perfil, tipo };
}

function enviar(caminho, dados, token, prefer, metodo = 'POST') {
  if (!integrado || (!autenticacaoPronta && caminho.startsWith('/auth/'))) {
    throw new Error('Integração indisponível neste ambiente.');
  }
  const headers = {
    apikey: config.chavePublicavel,
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (prefer) headers.Prefer = prefer;

  return fetch(config.url + caminho, {
    method: metodo,
    headers,
    body: JSON.stringify(dados),
    credentials: 'omit',
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
}

async function cadastrar(evento) {
  evento.preventDefault();
  if (ocupado) return;
  const formulario = evento.currentTarget;
  const erro = formulario.querySelector('[role="alert"]');
  erro.textContent = '';
  if (integrado && !autenticacaoPronta) {
    erro.textContent = avisoAutenticacao;
    return;
  }
  let cadastro;
  try {
    cadastro = lerPerfil(formulario, formulario.dataset.cadastro);
  } catch (falha) {
    erro.textContent = falha.message;
    return;
  }
  if (!integrado) {
    formulario.reset();
    resultado('Cadastro de demonstração', 'Formulário validado. Nenhum dado foi enviado.');
    return;
  }

  const secao = formulario.closest('section');
  bloquear(secao, true);
  try {
    const resposta = await enviar('/auth/v1/otp', {
      email: cadastro.email,
      create_user: true,
    });
    if (!resposta.ok) throw new Error();
    pendente = { ...cadastro, formulario };
    confirmacao.reset();
    // O campo pode ter ficado desativado após uma tentativa anterior.
    confirmacao.elements.token.disabled = false;
    confirmacao.querySelector('[role="alert"]').textContent = '';
    mostrar('confirmacao');
  } catch {
    erro.textContent = 'O código não pôde ser enviado. Aguarde um momento e tente novamente.';
  } finally {
    bloquear(secao, false);
  }
}

const campoCodigo = confirmacao.elements.token;

confirmacao.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (ocupado || !pendente) return;

  const erro = confirmacao.querySelector('[role="alert"]');
  const secao = confirmacao.closest('section');
  const codigo = campoCodigo.value;
  erro.textContent = '';
  bloquear(secao, true);
  try {
    if (!pendente.sessao) {
      const verificacao = await enviar('/auth/v1/verify', {
        email: pendente.email,
        token: codigo,
        type: 'email',
      });
      if (!verificacao.ok) {
        erro.textContent = 'O código não pôde ser confirmado. Confira o código ou solicite outro.';
        return;
      }
      const { access_token, user } = await verificacao.json();
      if (!access_token || !user?.id) throw new Error();
      pendente.sessao = { token: access_token, usuario: user.id };
    }

    const { token, usuario } = pendente.sessao;
    const tabela = tabelas[pendente.tipo];
    const resposta = await enviar(
      `/rest/v1/${tabela}?on_conflict=usuario_id`,
      { ...pendente.perfil, usuario_id: usuario },
      token,
      'resolution=merge-duplicates,return=minimal',
    );
    if (resposta.status === 401) {
      pendente.sessao = undefined;
      campoCodigo.value = '';
      erro.textContent = 'Sua sessão expirou. Volte ao cadastro e solicite um novo código.';
      return;
    }
    if (!resposta.ok) throw new Error();

    iniciarSessao(pendente.sessao);
    pendente.formulario.reset();
    pendente = undefined;
    confirmacao.reset();
    resultado('Cadastro concluído', 'Seu perfil foi salvo.');
  } catch {
    erro.textContent = 'Não foi possível concluir o cadastro. Tente novamente.';
  } finally {
    bloquear(secao, false);
    // Se o código já foi consumido, uma nova tentativa só repete a gravação.
    campoCodigo.disabled = Boolean(pendente?.sessao);
    if (campoCodigo.disabled) campoCodigo.value = '';
  }
});

for (const formulario of document.querySelectorAll('[data-cadastro]')) {
  formulario.addEventListener('submit', cadastrar);
}
for (const botao of document.querySelectorAll('[data-pagina]')) {
  botao.addEventListener('click', () => {
    if (ocupado) return;
    const secao = botao.closest('section');
    const formulario = secao.querySelector('[data-cadastro]');
    formulario?.reset();
    formulario?.querySelector('[role="alert"]').replaceChildren();
    mostrar(botao.dataset.pagina);
  });
}
document.querySelector('#voltar-cadastro').addEventListener('click', () => {
  if (!pendente || ocupado) return;
  const { tipo } = pendente;
  pendente = undefined;
  confirmacao.reset();
  campoCodigo.disabled = false;
  mostrar(tipo);
});

