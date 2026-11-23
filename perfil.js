'use strict';

const formPerfil = elemento('form-perfil');
const tipoPerfil = elemento('tipo-perfil');
const secaoPerfil = elemento('perfil');
const statusPerfil = elemento('status-perfil');
let versaoPerfil = 0;
let perfilEmTela;
let carregandoPerfil = false;
const areaAnaliseProfissional = elemento('analise-profissional');
const statusAnaliseProfissional = elemento('status-analise-profissional');
const solicitarAnaliseProfissional = elemento('solicitar-analise-profissional');

function limparAnaliseProfissional() {
  areaAnaliseProfissional.hidden = true;
  solicitarAnaliseProfissional.hidden = true;
  statusAnaliseProfissional.textContent = '';
}

function limparPerfil() {
  limparAnaliseProfissional();
  versaoPerfil++;
  if (carregandoPerfil) bloquear(secaoPerfil, false);
  carregandoPerfil = false;
  perfilEmTela = undefined;
  formPerfil.reset(); formPerfil.hidden = true;
  tipoPerfil.value = 'cliente';
  statusPerfil.textContent = '';
  elemento('visibilidade-perfil').textContent = '';
}

function apiPerfil(tipo, usuario, dados) {
  const colunas = tipo === 'cliente' ? 'usuario_id,nome,email,telefone,cidade'
    : 'usuario_id,nome,telefone,cidade,servico,descricao,publicado,tipo_prestador,tipo_atividade';
  const filtros = new URLSearchParams({usuario_id:'eq.' + usuario, select:dados ? (tipo === 'profissional' ? 'usuario_id,publicado' : 'usuario_id') : colunas});
  return controleSessao.requisitar(token => enviar(`/rest/v1/${tabelas[tipo]}?${filtros}`, dados,
    token, dados ? 'return=representation' : undefined, dados ? 'PATCH' : 'GET'));
}

async function carregarPerfil() {
  if (ocupado || carregandoPerfil || !sessaoServicos) return;
  const versao = ++versaoPerfil;
  const usuario = sessaoServicos.usuario;
  const tipo = tipoPerfil.value;
  if (!['cliente','profissional'].includes(tipo)) return;
  limparAnaliseProfissional();
  perfilEmTela = undefined; formPerfil.reset(); formPerfil.hidden = true;
  elemento('visibilidade-perfil').textContent = '';
  carregandoPerfil = true; bloquear(secaoPerfil, true);
  statusPerfil.textContent = 'Carregando seu cadastro…';
  try {
    const resposta = await apiPerfil(tipo, usuario);
    if (versao !== versaoPerfil) return;
    if (resposta.status === 401) {exigirNovoLogin('perfil'); return;}
    if (!resposta.ok) throw new Error();
    const registros = await resposta.json();
    if (versao !== versaoPerfil) return;
    if (!Array.isArray(registros) || registros.length > 1) throw new Error();
    const registro = registros[0];
    if (!registro) {
      statusPerfil.textContent = 'Você ainda não tem este cadastro. Use Sou Cliente ou Sou Profissional na página inicial.';
      return;
    }
    if (registro.usuario_id !== usuario || !['nome','cidade'].every(c => typeof registro[c] === 'string')) throw new Error();
    for (const campo of ['nome','email','telefone','cidade','servico','descricao','tipo_prestador','tipo_atividade']) {
      formPerfil.elements[campo].value = typeof registro[campo] === 'string' ? registro[campo] : '';
    }
    elemento('email-perfil').hidden = tipo !== 'cliente';
    elemento('campos-profissional').hidden = tipo !== 'profissional';
    formPerfil.elements.servico.required = tipo === 'profissional';
    for (const campo of ['tipo_prestador', 'tipo_atividade']) {
      formPerfil.elements[campo].required = tipo === 'profissional';
      formPerfil.elements[campo].disabled = tipo !== 'profissional';
    }
    elemento('visibilidade-perfil').textContent = tipo === 'profissional'
      ? registro.publicado ? 'Seu perfil está visível na busca. Alterações em nome, cidade, serviço, descrição ou modalidade exigirão nova análise antes de voltar à busca.' : 'Seu perfil ainda não está publicado na busca. A publicação depende de análise.' : '';
    perfilEmTela = {usuario, tipo, publicado:registro.publicado === true}; formPerfil.hidden = false;
    areaAnaliseProfissional.hidden = tipo !== 'profissional' || registro.publicado === true;
    statusPerfil.textContent = 'Edite seus dados e salve. O e-mail de acesso não é alterado nesta tela.';
  } catch {
    if (versao === versaoPerfil) statusPerfil.textContent = 'Não foi possível carregar seu cadastro. Tente atualizar.';
  } finally {
    if (versao === versaoPerfil) {carregandoPerfil = false; bloquear(secaoPerfil, false);}
  }
}

formPerfil.addEventListener('submit', async evento => {
  evento.preventDefault();
  const atual = perfilEmTela;
  if (ocupado || carregandoPerfil || !atual || atual.usuario !== sessaoServicos?.usuario) return;
  let dados;
  try {dados = lerPerfil(formPerfil, atual.tipo, atual.tipo === 'cliente').perfil;}
  catch (erro) {statusPerfil.textContent = erro.message; return;}
  const versao = versaoPerfil;
  carregandoPerfil = true; bloquear(secaoPerfil, true);
  statusPerfil.textContent = 'Salvando seu cadastro…';
  try {
    const resposta = await apiPerfil(atual.tipo, atual.usuario, dados);
    if (versao !== versaoPerfil) return;
    if (resposta.status === 401) {exigirNovoLogin('perfil'); return;}
    if (!resposta.ok) throw new Error();
    const registros = await resposta.json();
    if (versao !== versaoPerfil) return;
    if (!Array.isArray(registros) || registros.length !== 1 || registros[0].usuario_id !== atual.usuario) throw new Error();
    if (atual.tipo === 'profissional') {
      if (typeof registros[0].publicado !== 'boolean') throw new Error();
      perfilEmTela = {...atual,publicado:registros[0].publicado};
      limparAnaliseProfissional();
      areaAnaliseProfissional.hidden = registros[0].publicado;
      elemento('visibilidade-perfil').textContent = registros[0].publicado
        ? 'Seu perfil está visível na busca. Alterações em nome, cidade, serviço, descrição ou modalidade exigirão nova análise antes de voltar à busca.'
        : 'Seu perfil ainda não está publicado na busca. A publicação depende de análise.';
    }
    statusPerfil.textContent = atual.tipo === 'profissional' && atual.publicado && !registros[0].publicado
      ? 'Cadastro salvo. Seu perfil saiu da busca e precisa de nova análise antes de ser publicado novamente.'
      : 'Seu cadastro foi atualizado.';
  } catch {
    if (versao === versaoPerfil) statusPerfil.textContent = 'Não foi possível confirmar a gravação. Atualize o cadastro para conferir os dados salvos.';
  } finally {
    if (versao === versaoPerfil) {carregandoPerfil = false; bloquear(secaoPerfil, false);}
  }
});
tipoPerfil.addEventListener('change', carregarPerfil);
elemento('atualizar-perfil').addEventListener('click', carregarPerfil);
elemento('abrir-perfil').addEventListener('click', () => proteger('perfil'));

async function acompanharAnaliseProfissional(criar = false) {
  const perfil = perfilEmTela;
  if (ocupado || carregandoPerfil || !perfil || perfil.tipo !== 'profissional' ||
      perfil.publicado || perfil.usuario !== sessaoServicos?.usuario) return;
  if (criar && !window.confirm('Solicitar análise do seu perfil salvo? A solicitação não publica seu perfil automaticamente.')) return;
  const versao = versaoPerfil;
  const sessao = sessaoServicos;
  const atual = () => versao === versaoPerfil && sessao === sessaoServicos && perfilEmTela === perfil;
  carregandoPerfil = true; bloquear(secaoPerfil, true);
  solicitarAnaliseProfissional.hidden = true;
  statusAnaliseProfissional.textContent = criar ? 'Registrando pedido de análise…' : 'Consultando pedido de análise…';
  try {
    if (criar) {
      const resposta = await controleSessao.requisitar(token => enviar(
        '/rest/v1/solicitacoes_analise_profissional', {usuario_id:perfil.usuario}, token, 'return=minimal'));
      if (!atual()) return;
      if (resposta.status === 401) {exigirNovoLogin('perfil'); return;}
      if (!resposta.ok && resposta.status !== 409) throw new Error();
    }
    const resposta = await controleSessao.requisitar(token => enviar(
      '/rest/v1/solicitacoes_analise_profissional?' + new URLSearchParams({
        usuario_id:'eq.'+perfil.usuario,select:'usuario_id,estado,criado_em',limit:'1',
      }), undefined, token, undefined, 'GET'));
    if (!atual()) return;
    if (resposta.status === 401) {exigirNovoLogin('perfil'); return;}
    if (!resposta.ok) throw new Error();
    const registros = await resposta.json();
    if (!atual()) return;
    if (!Array.isArray(registros) || registros.length > 1) throw new Error();
    const pedido = registros[0];
    if (pedido) {
      if (pedido.usuario_id !== perfil.usuario || pedido.estado !== 'aguardando_analise' ||
          typeof pedido.criado_em !== 'string' || !Number.isFinite(Date.parse(pedido.criado_em))) throw new Error();
      statusAnaliseProfissional.textContent = 'Pedido registrado. Seu perfil aguarda análise e ainda não foi publicado. A administração analisará os dados salvos no seu cadastro.';
    } else {
      if (criar) throw new Error();
      // A prontidão é conferida nos dados salvos, não apenas no formulário em edição.
      const respostaPerfil = await apiPerfil('profissional',perfil.usuario);
      if (!atual()) return;
      if (respostaPerfil.status === 401) {exigirNovoLogin('perfil'); return;}
      if (!respostaPerfil.ok) throw new Error();
      const salvos = await respostaPerfil.json();
      if (!atual()) return;
      if (!Array.isArray(salvos) || salvos.length !== 1 || salvos[0].usuario_id !== perfil.usuario) throw new Error();
      const salvo = salvos[0];
      const pronto = salvo.publicado === false &&
        ['pessoa_fisica','mei','empresa'].includes(salvo.tipo_prestador) &&
        ['regular','ocasional'].includes(salvo.tipo_atividade);
      statusAnaliseProfissional.textContent = pronto
        ? 'Nenhum pedido de análise registrado. Você pode solicitar a análise do seu cadastro salvo.'
        : 'Atualize e salve seu cadastro profissional completo antes de pedir análise. Se o perfil já foi publicado, atualize esta tela.';
      solicitarAnaliseProfissional.hidden = !pronto;
    }
  } catch {
    if (atual()) statusAnaliseProfissional.textContent = criar
      ? 'Não foi possível confirmar o pedido. Consulte novamente antes de repetir. Confira também se o cadastro está completo e salvo.'
      : 'Não foi possível consultar a análise. Tente novamente.';
  } finally {
    if (atual()) {carregandoPerfil = false; bloquear(secaoPerfil, false);}
  }
}
elemento('consultar-analise-profissional').addEventListener('click', () => acompanharAnaliseProfissional());
solicitarAnaliseProfissional.addEventListener('click', () => acompanharAnaliseProfissional(true));
