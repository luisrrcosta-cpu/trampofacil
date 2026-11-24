'use strict';

const formPerfil = elemento('form-perfil');
const tipoPerfil = elemento('tipo-perfil');
const secaoPerfil = elemento('perfil');
const statusPerfil = elemento('status-perfil');
let versaoPerfil = 0;
let perfilEmTela;
let carregandoPerfil = false;
const areaDisponibilidade = elemento('disponibilidade-profissional');
const alternarDisponibilidade = elemento('alternar-disponibilidade-profissional');
function limparDisponibilidade() {
  areaDisponibilidade.hidden = true;
  elemento('status-disponibilidade-profissional').textContent = '';
}
function atualizarDisponibilidade(registro) {
  if (typeof registro.pausado !== 'boolean') throw new Error();
  areaDisponibilidade.hidden = false;
  alternarDisponibilidade.textContent = registro.pausado ? 'Retomar novos pedidos' : 'Pausar novos pedidos';
  elemento('status-disponibilidade-profissional').textContent = registro.pausado
    ? 'Novos pedidos pausados. Seu perfil fica fora da busca; os contratos existentes continuam disponíveis.'
    : 'Novos pedidos disponíveis quando o perfil estiver aprovado. Retomar não aprova um perfil pendente.';
  if (registro.publicado && registro.pausado) elemento('visibilidade-perfil').textContent = 'Perfil aprovado, mas pausado e fora da busca.';
}
const areaAnaliseProfissional = elemento('analise-profissional');
const statusAnaliseProfissional = elemento('status-analise-profissional');
const solicitarAnaliseProfissional = elemento('solicitar-analise-profissional');

function limparAnaliseProfissional() {
  elemento('status-orientacao-profissional').textContent = '';
  elemento('status-recusa-profissional').textContent = '';
  areaAnaliseProfissional.hidden = true;
  solicitarAnaliseProfissional.hidden = true;
  statusAnaliseProfissional.textContent = '';
}

function limparPerfil() {
  limparDisponibilidade();
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
    : 'usuario_id,nome,telefone,cidade,servico,descricao,publicado,tipo_prestador,tipo_atividade,pausado';
  const filtros = new URLSearchParams({usuario_id:'eq.' + usuario, select:dados ? (tipo === 'profissional' ? 'usuario_id,publicado,pausado' : 'usuario_id') : colunas});
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
  limparDisponibilidade();
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
    if (tipo === 'profissional') atualizarDisponibilidade(registro);
    perfilEmTela = {usuario, tipo, publicado:registro.publicado === true, pausado:registro.pausado}; formPerfil.hidden = false;
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
      if (typeof registros[0].pausado !== 'boolean') throw new Error();
      perfilEmTela = {...atual,publicado:registros[0].publicado,pausado:registros[0].pausado};
      limparAnaliseProfissional();
      areaAnaliseProfissional.hidden = registros[0].publicado;
      elemento('visibilidade-perfil').textContent = registros[0].publicado
        ? 'Seu perfil está visível na busca. Alterações em nome, cidade, serviço, descrição ou modalidade exigirão nova análise antes de voltar à busca.'
        : 'Seu perfil ainda não está publicado na busca. A publicação depende de análise.';
      atualizarDisponibilidade(registros[0]);
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

alternarDisponibilidade.addEventListener('click',async()=>{
  const perfil=perfilEmTela;
  if(ocupado||carregandoPerfil||!perfil||perfil.tipo!=='profissional'||perfil.usuario!==sessaoServicos?.usuario||typeof perfil.pausado!=='boolean')return;
  const pausado=!perfil.pausado;
  if(!window.confirm(pausado?'Pausar novos pedidos? Os contratos existentes continuarão disponíveis.':'Retomar novos pedidos? O perfil só voltará à busca se continuar aprovado.'))return;
  const versao=versaoPerfil, sessao=sessaoServicos;
  const atual=()=>versao===versaoPerfil&&sessao===sessaoServicos;
  carregandoPerfil=true;bloquear(secaoPerfil,true);
  statusPerfil.textContent='Atualizando disponibilidade…';
  try{
    const resposta=await apiPerfil('profissional',perfil.usuario,{pausado});
    if(!atual())return;
    if(resposta.status===401){exigirNovoLogin('perfil');return;}
    if(!resposta.ok)throw new Error();
    const registros=await resposta.json();
    if(!atual())return;
    if(!Array.isArray(registros)||registros.length!==1||registros[0].usuario_id!==perfil.usuario||
       registros[0].pausado!==pausado||typeof registros[0].publicado!=='boolean')throw new Error();
    const registro=registros[0];
    perfilEmTela={...perfil,publicado:registro.publicado,pausado:registro.pausado};
    limparAnaliseProfissional();areaAnaliseProfissional.hidden=registro.publicado;
    elemento('visibilidade-perfil').textContent=registro.publicado
      ? 'Seu perfil está visível na busca.'
      : 'Seu perfil ainda não está publicado na busca. A publicação depende de análise.';
    atualizarDisponibilidade(registro);
    statusPerfil.textContent='Disponibilidade atualizada. Alterações nos outros campos só serão gravadas ao salvar o cadastro.';
  }catch{
    if(atual())statusPerfil.textContent='Não foi possível confirmar a disponibilidade. Atualize o cadastro antes de repetir.';
  }finally{
    if(atual()){carregandoPerfil=false;bloquear(secaoPerfil,false);}
  }
});


// Revisão administrativa: autorização sempre conferida no servidor.
let versaoRevisao = 0;
let paginaRevisao = 0;
const secaoRevisao = elemento('revisao');
const listaRevisao = elemento('lista-revisao');
const statusRevisao = elemento('status-revisao');
const anteriorRevisao = elemento('anterior-revisao');
const proximaRevisao = elemento('proxima-revisao');
function limparRevisao() {
  versaoRevisao++;
  paginaRevisao = 0;
  listaRevisao.replaceChildren();
  statusRevisao.textContent = '';
  anteriorRevisao.hidden = true;
  proximaRevisao.hidden = true;
  bloquear(secaoRevisao, false);
}
function apiRevisao(nome, dados) {
  return controleSessao.requisitar(token => enviar('/rest/v1/rpc/' + nome, dados, token));
}
function perfilRevisaoValido(item) {
  const p = item?.perfil;
  return item && typeof item.usuario_id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.usuario_id) &&
    typeof item.solicitado_em === 'string' && Number.isFinite(Date.parse(item.solicitado_em)) &&
    p && typeof p === 'object' && !Array.isArray(p) &&
    Object.keys(p).sort().join(',') === 'cidade,descricao,nome,servico,tipo_atividade,tipo_prestador' &&
    ['nome','cidade','servico'].every(c => typeof p[c] === 'string' && p[c].length >= 2 && p[c].length <= 120) &&
    (p.descricao === null || typeof p.descricao === 'string' && p.descricao.length <= 1000) &&
    (p.tipo_prestador === null || ['pessoa_fisica','mei','empresa'].includes(p.tipo_prestador)) &&
    (p.tipo_atividade === null || ['regular','ocasional'].includes(p.tipo_atividade)) &&
    (item.recusa == null || recusaPublicacaoValida(item.recusa));
}
async function carregarRevisao(pagina = 0, aviso = '') {
  if (ocupado || !sessaoServicos || !Number.isInteger(pagina) || pagina < 0 || pagina > 10000) return;
  const sessaoOriginal = sessaoServicos;
  const versao = ++versaoRevisao;
  const atual = () => sessaoServicos === sessaoOriginal && versaoRevisao === versao;
  listaRevisao.replaceChildren();
  anteriorRevisao.hidden = true;
  proximaRevisao.hidden = true;
  bloquear(secaoRevisao, true);
  statusRevisao.textContent = 'Consultando fila de análise…';
  try {
    const resposta = await apiRevisao('listar_perfis_revisao', {pagina});
    if (!atual()) return;
    if (resposta.status === 401) {exigirNovoLogin('revisao');return;}
    if (resposta.status === 403) {
      statusRevisao.textContent = 'Área reservada à conta revisora autorizada.';
      return;
    }
    if (!resposta.ok) throw new Error();
    const fila = await resposta.json();
    if (!atual()) return;
    if (!Array.isArray(fila) || fila.length > 51 || !fila.every(perfilRevisaoValido) ||
        new Set(fila.map(p => p.usuario_id)).size !== fila.length) throw new Error();
    for (const item of fila.slice(0,50)) {
      const p = item.perfil;
      const card = document.createElement('article');
      card.append(texto('h3',p.nome),texto('p',p.servico + ' · ' + p.cidade));
      card.append(texto('p','Solicitado em: ' + new Date(item.solicitado_em).toLocaleString('pt-BR')));
      if (p.descricao) card.append(texto('p',p.descricao));
      const modalidades = {pessoa_fisica:'Pessoa física (CPF)',mei:'MEI',empresa:'Empresa (CNPJ)'};
      card.append(texto('p',(modalidades[p.tipo_prestador] || 'Modalidade não informada') + ' · ' +
        ({regular:'Atividade regular',ocasional:'Serviços ocasionais'}[p.tipo_atividade] || 'Frequência não informada')));
      if (p.tipo_prestador && p.tipo_atividade) {
        card.append(botaoAcao('Aprovar publicação de ' + p.nome, () => aprovarPerfilRevisao(item)));
      } else card.append(texto('p','Cadastro incompleto. Aguarde o profissional preencher as modalidades.'));
      const rotulo = document.createElement('label');
      rotulo.append(texto('span','Orientação para o profissional'));
      const motivo = document.createElement('select');
      motivo.setAttribute('aria-label','Orientação para o profissional');
      motivo.append(texto('option','Escolha o ajuste'));
      motivo.firstChild.value = '';
      for (const [valor, mensagem] of Object.entries(motivosAjustePerfil)) {
        const opcao = texto('option',mensagem); opcao.value = valor; motivo.append(opcao);
      }
      rotulo.append(motivo);
      card.append(rotulo,botaoAcao('Pedir ajuste de ' + p.nome, () => pedirAjusteRevisao(item,motivo.value)));
      if (item.recusa) card.append(texto('p','Última recusa registrada: ' +
        motivosRecusaPublicacao[item.recusa.motivo] + '. ' +
        (item.recusa.perfil_alterado ? 'O cadastro mudou desde essa decisão e pode ser reavaliado.' : 'Uma nova decisão pode ser registrada após a revisão.')));
      const rotuloRecusa = document.createElement('label');
      rotuloRecusa.append(texto('span','Motivo da recusa'));
      const motivoRecusa = document.createElement('select');
      motivoRecusa.setAttribute('aria-label','Motivo da recusa');
      motivoRecusa.append(texto('option','Escolha o motivo')); motivoRecusa.firstChild.value='';
      for (const [valor,mensagem] of Object.entries(motivosRecusaPublicacao)) {
        const opcao=texto('option',mensagem);opcao.value=valor;motivoRecusa.append(opcao);
      }
      rotuloRecusa.append(motivoRecusa);
      card.append(rotuloRecusa,botaoAcao('Recusar publicação de ' + p.nome,()=>recusarPublicacao(item,motivoRecusa.value)));
      listaRevisao.append(card);
    }
    paginaRevisao = pagina;
    anteriorRevisao.hidden = pagina === 0;
    proximaRevisao.hidden = fila.length <= 50 || pagina === 10000;
    statusRevisao.textContent = aviso || (fila.length
      ? 'Página ' + (pagina + 1) + ': ' + Math.min(fila.length,50) + ' perfis para análise.'
      : 'Nenhum perfil pendente nesta página.');
  } catch {
    if (atual()) {
      listaRevisao.replaceChildren();
      statusRevisao.textContent = 'Não foi possível consultar a fila. Atualize para tentar novamente.';
    }
  } finally {
    if (atual()) bloquear(secaoRevisao,false);
  }
}
async function aprovarPerfilRevisao(item) {
  if (ocupado || !sessaoServicos || !perfilRevisaoValido(item)) return;
  if (!window.confirm('Aprovar a publicação de “' + item.perfil.nome +
    '”? Esta aprovação não comprova identidade, documentos ou habilitação profissional.')) return;
  const sessaoOriginal = sessaoServicos;
  const versao = versaoRevisao;
  const atual = () => sessaoServicos === sessaoOriginal && versaoRevisao === versao;
  bloquear(secaoRevisao,true);
  statusRevisao.textContent = 'Registrando aprovação…';
  let aprovado = false;
  try {
    const resposta = await apiRevisao('aprovar_perfil_administrativo',
      {alvo:item.usuario_id,esperado:item.perfil});
    if (!atual()) return;
    if (resposta.status === 401) {exigirNovoLogin('revisao');return;}
    if (!resposta.ok) throw new Error();
    const evento = await resposta.json();
    if (!atual()) return;
    if (!Number.isSafeInteger(evento) || evento < 1) throw new Error();
    aprovado = true;
  } catch {
    if (atual()) {
      listaRevisao.replaceChildren();
      anteriorRevisao.hidden = true;
      proximaRevisao.hidden = true;
      statusRevisao.textContent = 'Não foi possível confirmar a aprovação. Atualize a fila e revise o perfil antes de tentar novamente.';
    }
  } finally {
    if (atual()) bloquear(secaoRevisao,false);
  }
  if (aprovado && atual()) await carregarRevisao(0,'Publicação aprovada. A disponibilidade continua sob controle do profissional.');
}
elemento('abrir-revisao').addEventListener('click', () => proteger('revisao'));
elemento('atualizar-revisao').addEventListener('click', () => carregarRevisao(paginaRevisao));
anteriorRevisao.addEventListener('click', () => carregarRevisao(paginaRevisao - 1));
proximaRevisao.addEventListener('click', () => carregarRevisao(paginaRevisao + 1));


const motivosAjustePerfil = Object.freeze({
  nome_apresentacao:'Revisar o nome de apresentação',
  cidade_atendimento:'Revisar a cidade de atendimento',
  detalhar_servico:'Detalhar o serviço oferecido e sua descrição',
});
async function pedirAjusteRevisao(item,motivo) {
  if (ocupado || !sessaoServicos || !perfilRevisaoValido(item)) return;
  if (!Object.prototype.hasOwnProperty.call(motivosAjustePerfil,motivo)) {
    statusRevisao.textContent = 'Escolha a orientação antes de pedir o ajuste.'; return;
  }
  if (!window.confirm('Pedir ajuste no cadastro de “' + item.perfil.nome + '”: ' + motivosAjustePerfil[motivo] + '?')) return;
  const sessao = sessaoServicos, versao = versaoRevisao;
  const atual = () => sessaoServicos === sessao && versaoRevisao === versao;
  bloquear(secaoRevisao,true);
  statusRevisao.textContent = 'Registrando orientação…';
  let salvo = false;
  try {
    const resposta = await apiRevisao('pedir_ajuste_perfil',{alvo:item.usuario_id,esperado:item.perfil,motivo_ajuste:motivo});
    if (!atual()) return;
    if (resposta.status === 401) {exigirNovoLogin('revisao');return;}
    if (!resposta.ok) throw new Error();
    const evento = await resposta.json();
    if (!atual()) return;
    if (!Number.isSafeInteger(evento) || evento < 1) throw new Error();
    salvo = true;
  } catch {
    if (atual()) {
      listaRevisao.replaceChildren(); anteriorRevisao.hidden = true; proximaRevisao.hidden = true;
      statusRevisao.textContent = 'Não foi possível confirmar a orientação. Atualize a fila e revise o cadastro antes de tentar novamente.';
    }
  } finally {
    if (atual()) bloquear(secaoRevisao,false);
  }
  if (salvo && atual()) await carregarRevisao(0,'Orientação registrada. O profissional poderá consultá-la no próprio cadastro; o perfil continua aguardando análise.');
}
async function consultarOrientacaoProfissional() {
  const perfil = perfilEmTela;
  if (ocupado || carregandoPerfil || !perfil || perfil.tipo !== 'profissional' ||
      perfil.publicado || perfil.usuario !== sessaoServicos?.usuario) return;
  const sessao = sessaoServicos, versao = versaoPerfil;
  const atual = () => sessaoServicos === sessao && versaoPerfil === versao && perfilEmTela === perfil;
  const status = elemento('status-orientacao-profissional');
  carregandoPerfil = true; bloquear(secaoPerfil,true); status.textContent = 'Consultando orientação…';
  try {
    const resposta = await apiRevisao('consultar_orientacao_perfil',{});
    if (!atual()) return;
    if (resposta.status === 401) {exigirNovoLogin('perfil');return;}
    if (!resposta.ok) throw new Error();
    const registros = await resposta.json();
    if (!atual()) return;
    if (!Array.isArray(registros) || registros.length > 1) throw new Error();
    if (!registros.length) {status.textContent = 'Nenhuma orientação de ajuste pendente para seu cadastro.';return;}
    const orientacao = registros[0];
    if (!orientacao || !Object.prototype.hasOwnProperty.call(motivosAjustePerfil,orientacao.motivo) ||
        typeof orientacao.perfil_alterado !== 'boolean' || typeof orientacao.criado_em !== 'string' ||
        !Number.isFinite(Date.parse(orientacao.criado_em))) throw new Error();
    status.textContent = 'Orientação da revisão: ' + motivosAjustePerfil[orientacao.motivo] + '. ' +
      (orientacao.perfil_alterado
        ? 'Seu cadastro foi alterado desde esta orientação. A administração ainda precisa analisar os dados salvos.'
        : 'Revise os campos indicados e salve seu cadastro. A alteração não publica o perfil automaticamente.');
  } catch {
    if (atual()) status.textContent = 'Não foi possível consultar a orientação. Tente novamente.';
  } finally {
    if (atual()) {carregandoPerfil=false;bloquear(secaoPerfil,false);}
  }
}
elemento('consultar-orientacao-profissional').addEventListener('click',consultarOrientacaoProfissional);


const motivosRecusaPublicacao = Object.freeze({
  informacoes_inconsistentes:'As informações do perfil precisam ser revistas por inconsistência',
  apresentacao_inadequada:'O conteúdo de apresentação precisa de adequação',
  servico_nao_identificavel:'O serviço oferecido não está claro',
});
function recusaPublicacaoValida(registro) {
  return registro && Object.prototype.hasOwnProperty.call(motivosRecusaPublicacao,registro.motivo) &&
    typeof registro.criado_em === 'string' && Number.isFinite(Date.parse(registro.criado_em)) &&
    typeof registro.perfil_alterado === 'boolean';
}
async function recusarPublicacao(item,motivo) {
  if (ocupado || !sessaoServicos || !perfilRevisaoValido(item)) return;
  if (!Object.prototype.hasOwnProperty.call(motivosRecusaPublicacao,motivo)) {
    statusRevisao.textContent='Escolha o motivo antes de recusar a publicação.';return;
  }
  if (!window.confirm('Recusar a publicação do perfil de “' + item.perfil.nome + '”? Motivo: ' +
      motivosRecusaPublicacao[motivo] + '. A conta e os contratos existentes não serão bloqueados.')) return;
  const sessao=sessaoServicos,versao=versaoRevisao;
  const atual=()=>sessaoServicos===sessao&&versaoRevisao===versao;
  bloquear(secaoRevisao,true);statusRevisao.textContent='Registrando recusa de publicação…';
  let salvo=false;
  try {
    const resposta=await apiRevisao('recusar_publicacao_perfil',{alvo:item.usuario_id,esperado:item.perfil,motivo_recusa:motivo});
    if(!atual())return;
    if(resposta.status===401){exigirNovoLogin('revisao');return;}
    if(!resposta.ok)throw new Error();
    const evento=await resposta.json();
    if(!atual())return;
    if(!Number.isSafeInteger(evento)||evento<1)throw new Error();
    salvo=true;
  }catch{
    if(atual()){
      listaRevisao.replaceChildren();anteriorRevisao.hidden=true;proximaRevisao.hidden=true;
      statusRevisao.textContent='Não foi possível confirmar a recusa. Atualize a fila antes de tentar novamente.';
    }
  }finally{if(atual())bloquear(secaoRevisao,false);}
  if(salvo&&atual())await carregarRevisao(0,'Recusa registrada. O profissional pode consultar o motivo e corrigir o cadastro para reavaliação.');
}
async function consultarRecusaProfissional() {
  const perfil=perfilEmTela;
  if(ocupado||carregandoPerfil||!perfil||perfil.tipo!=='profissional'||perfil.publicado||perfil.usuario!==sessaoServicos?.usuario)return;
  const sessao=sessaoServicos,versao=versaoPerfil;
  const atual=()=>sessaoServicos===sessao&&versaoPerfil===versao&&perfilEmTela===perfil;
  const status=elemento('status-recusa-profissional');
  carregandoPerfil=true;bloquear(secaoPerfil,true);status.textContent='Consultando decisão de publicação…';
  try{
    const resposta=await apiRevisao('consultar_recusa_publicacao',{});
    if(!atual())return;
    if(resposta.status===401){exigirNovoLogin('perfil');return;}
    if(!resposta.ok)throw new Error();
    const registros=await resposta.json();
    if(!atual())return;
    if(!Array.isArray(registros)||registros.length>1)throw new Error();
    if(!registros.length){status.textContent='Nenhuma recusa de publicação pendente para seu cadastro.';return;}
    const recusa=registros[0];
    if(!recusaPublicacaoValida(recusa))throw new Error();
    status.textContent='Última recusa de publicação: ' + motivosRecusaPublicacao[recusa.motivo] + '. ' +
      (recusa.perfil_alterado?'Seu cadastro mudou desde essa decisão. A administração pode reavaliar os dados salvos.':
        'Revise e salve seu cadastro para nova análise. A conta e os contratos existentes continuam disponíveis.');
  }catch{if(atual())status.textContent='Não foi possível consultar a decisão. Tente novamente.';}
  finally{if(atual()){carregandoPerfil=false;bloquear(secaoPerfil,false);}}
}
elemento('consultar-recusa-profissional').addEventListener('click',consultarRecusaProfissional);
