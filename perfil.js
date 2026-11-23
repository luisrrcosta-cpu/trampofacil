'use strict';

const formPerfil = elemento('form-perfil');
const tipoPerfil = elemento('tipo-perfil');
const secaoPerfil = elemento('perfil');
const statusPerfil = elemento('status-perfil');
let versaoPerfil = 0;
let perfilEmTela;
let carregandoPerfil = false;

function limparPerfil() {
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
  const filtros = new URLSearchParams({usuario_id:'eq.' + usuario, select:dados ? 'usuario_id' : colunas});
  return controleSessao.requisitar(token => enviar(`/rest/v1/${tabelas[tipo]}?${filtros}`, dados,
    token, dados ? 'return=representation' : undefined, dados ? 'PATCH' : 'GET'));
}

async function carregarPerfil() {
  if (ocupado || carregandoPerfil || !sessaoServicos) return;
  const versao = ++versaoPerfil;
  const usuario = sessaoServicos.usuario;
  const tipo = tipoPerfil.value;
  if (!['cliente','profissional'].includes(tipo)) return;
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
      ? registro.publicado ? 'Seu perfil está visível na busca.' : 'Seu perfil ainda não está publicado na busca. A publicação depende de análise.' : '';
    perfilEmTela = {usuario, tipo}; formPerfil.hidden = false;
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
    statusPerfil.textContent = 'Seu cadastro foi atualizado.';
  } catch {
    if (versao === versaoPerfil) statusPerfil.textContent = 'Não foi possível confirmar a gravação. Atualize o cadastro para conferir os dados salvos.';
  } finally {
    if (versao === versaoPerfil) {carregandoPerfil = false; bloquear(secaoPerfil, false);}
  }
});
tipoPerfil.addEventListener('change', carregarPerfil);
elemento('atualizar-perfil').addEventListener('click', carregarPerfil);
elemento('abrir-perfil').addEventListener('click', () => proteger('perfil'));
