'use strict';

const motivosReclamacao = Object.freeze({
  servico_nao_realizado:'Serviço não realizado', qualidade:'Problema de qualidade',
  divergencia_combinado:'Diferente do combinado', cobranca:'Dúvida ou problema de cobrança', outro:'Outro problema',
});
const uuidReclamacao = v => typeof v==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const descricaoReclamacaoValida = v => typeof v==='string' && v.trim().length>=10 && v.length<=2000;
const dataReclamacaoValida = v => typeof v==='string' && Number.isFinite(Date.parse(v));
function dataReclamacao(v) {
  const n=document.createElement('time'); n.dateTime=new Date(v).toISOString();
  n.textContent=new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(v))+' (Brasília)';
  return n;
}
function adicionarReclamacaoServico(card,pedido,cliente) {
  if(!uuidReclamacao(pedido.id))return;
  const area=document.createElement('details');
  area.className='reclamacao-servico';area.append(texto('summary','Problemas e reclamações — '+pedido.titulo));
  const aviso=texto('p','Registre o problema para análise. Este registro não aprova reembolso nem bloqueia ou movimenta dinheiro no banco.');
  const estado=texto('p','');estado.setAttribute('role','status');
  const registro=document.createElement('div');
  const form=document.createElement('form');form.hidden=true;
  const categoria=document.createElement('select');categoria.required=true;
  const vazia=texto('option','Escolha o motivo');vazia.value='';categoria.append(vazia);
  for(const [valor,rotulo]of Object.entries(motivosReclamacao)){const o=texto('option',rotulo);o.value=valor;categoria.append(o);}
  const labelMotivo=texto('label','Motivo da reclamação');labelMotivo.append(categoria);
  const relato=document.createElement('textarea');relato.required=true;relato.minLength=10;relato.maxLength=2000;
  const labelRelato=texto('label',cliente?'Descreva o problema':'Resposta do profissional');labelRelato.append(relato);
  const orientacao=texto('p','Use de 10 a 2.000 caracteres. Não informe documentos, senhas, dados bancários ou endereço completo. O texto será visível às partes e ao atendimento autorizado.');
  const botao=texto('button',cliente?'Registrar reclamação':'Registrar resposta');botao.type='submit';
  if(cliente)form.append(labelMotivo);form.append(labelRelato,orientacao,botao);
  const consultar=botaoAcao('Consultar reclamação',()=>executar());
  area.append(aviso,consultar,registro,form,estado);card.append(area);
  let carregando=false,registrada=false,respostaRegistrada=false,incerto=false;
  form.addEventListener('submit',evento=>{
    evento.preventDefault();
    if(ocupado||carregando||incerto||!descricaoReclamacaoValida(relato.value))return;
    if(cliente && (registrada||!Object.hasOwn(motivosReclamacao,categoria.value)))return;
    if(!cliente && (!registrada||respostaRegistrada))return;
    if(!window.confirm(cliente?'Registrar este relato inicial? Ele ficará disponível para o profissional e atendimento autorizado. Isso não solicita um estorno automático.':'Registrar sua resposta inicial? Ela ficará disponível para o cliente e atendimento autorizado.'))return;
    executar({descricao:relato.value.trim(),...(cliente?{motivo:categoria.value}:{})});
  });
  async function executar(dados) {
    if(ocupado||carregando||!sessaoServicos)return;
    const sessaoOriginal=sessaoServicos,versaoOriginal=versaoPedidos;
    const ator=sessaoOriginal.usuario;
    if(ator!==(cliente?pedido.cliente_usuario_id:pedido.profissional_usuario_id))return;
    const atual=()=>sessaoServicos===sessaoOriginal&&versaoPedidos===versaoOriginal&&area.isConnected;
    carregando=true;form.hidden=true;registro.replaceChildren();bloquear(elemento('solicitacoes'),true);
    estado.textContent=dados?'Registrando…':'Consultando reclamação…';
    const requisitar=(tabela,campos)=>controleSessao.requisitar(token=>enviar('/rest/v1/'+tabela+'?'+new URLSearchParams({solicitacao_id:'eq.'+pedido.id,select:campos,limit:'1'}),undefined,token,undefined,'GET'));
    try {
      if(dados){
        incerto=true;
        const r=await controleSessao.requisitar(token=>enviar('/rest/v1/'+(cliente?'reclamacoes_servico':'respostas_reclamacao'),{solicitacao_id:pedido.id,...dados},token,'return=minimal'));
        if(!atual())return;
        if(r.status===401){exigirNovoLogin('solicitacoes');return;}
        // A chave única por pedido evita duplicação após resposta perdida.
        if(!r.ok&&r.status!==409)throw Error();
      }
      const r=await requisitar('reclamacoes_servico','solicitacao_id,cliente_usuario_id,motivo,descricao,criado_em');
      if(!atual())return;
      if(r.status===401){exigirNovoLogin('solicitacoes');return;}
      if(!r.ok)throw Error();
      const linhas=await r.json();if(!atual())return;
      if(!Array.isArray(linhas)||linhas.length>1)throw Error();
      if(!linhas.length){
        if(dados)throw Error();
        registrada=false;respostaRegistrada=false;incerto=false;
        estado.textContent='Nenhuma reclamação registrada neste pedido.';form.hidden=!cliente;return;
      }
      const item=linhas[0];
      if(item.solicitacao_id!==pedido.id||item.cliente_usuario_id!==pedido.cliente_usuario_id||!Object.hasOwn(motivosReclamacao,item.motivo)||!descricaoReclamacaoValida(item.descricao)||!dataReclamacaoValida(item.criado_em))throw Error();
      const rr=await requisitar('respostas_reclamacao','solicitacao_id,profissional_usuario_id,descricao,criado_em');
      if(!atual())return;
      if(rr.status===401){exigirNovoLogin('solicitacoes');return;}
      if(!rr.ok)throw Error();
      const respostas=await rr.json();if(!atual())return;
      if(!Array.isArray(respostas)||respostas.length>1)throw Error();
      const resposta=respostas[0];
      if(resposta&&(resposta.solicitacao_id!==pedido.id||resposta.profissional_usuario_id!==pedido.profissional_usuario_id||!descricaoReclamacaoValida(resposta.descricao)||!dataReclamacaoValida(resposta.criado_em)))throw Error();
      if(dados&&!cliente&&!resposta)throw Error();
      registrada=true;respostaRegistrada=Boolean(resposta);incerto=false;
      registro.append(texto('h4','Relato do cliente'),texto('p','Referência do caso: '+pedido.id),texto('p',motivosReclamacao[item.motivo]),texto('p',item.descricao),dataReclamacao(item.criado_em));
      if(resposta)registro.append(texto('h4','Resposta do profissional'),texto('p',resposta.descricao),dataReclamacao(resposta.criado_em));
      adicionarHistoricoReclamacao(registro,pedido.id);
      estado.textContent='Registro recebido para análise. Consulte o acompanhamento para atualizações. O registro não comprova reembolso ou bloqueio bancário.';
      if(dados){relato.value='';categoria.value='';}
      form.hidden=cliente||respostaRegistrada;
    }catch{
      if(atual())estado.textContent=incerto?'Não foi possível confirmar o registro. Consulte novamente antes de tentar registrar; nenhum envio será repetido automaticamente.':'Não foi possível consultar a reclamação. Tente novamente.';
    }finally{
      carregando=false;if(atual())bloquear(elemento('solicitacoes'),false);
    }
  }
}

const estadosReclamacao=Object.freeze({aguardando_analise:'Aguardando análise',em_analise:'Em análise',concluida:'Atendimento concluído'});
function adicionarHistoricoReclamacao(container,pedidoId,contexto='solicitacoes'){
  const area=document.createElement('section'),lista=document.createElement('div'),estado=texto('p','');estado.setAttribute('role','status');
  const aviso=texto('p','O andamento se refere ao atendimento. Concluir o caso não executa reembolso, não comprova bloqueio bancário e não encerra os direitos legais do cliente.');
  let carregando=false,cursor=2147483647;
  const atualizar=botaoAcao('Consultar acompanhamento',()=>consultar(true));
  const anteriores=botaoAcao('Ver atualizações anteriores',()=>consultar(false));anteriores.hidden=true;
  area.append(atualizar,estado,aviso,lista,anteriores);container.append(area);
  async function consultar(reiniciar){
    if(carregando||ocupado||!sessaoServicos)return;
    const sessaoOriginal=sessaoServicos,versao=contexto==='reclamacoes-admin'?versaoReclamacoesAdmin:versaoPedidos;
    const atual=()=>area.isConnected&&sessaoServicos===sessaoOriginal&&versao===(contexto==='reclamacoes-admin'?versaoReclamacoesAdmin:versaoPedidos);
    const antes=reiniciar?2147483647:cursor;carregando=true;bloquear(area,true);estado.textContent='Consultando acompanhamento…';
    if(reiniciar){lista.replaceChildren();anteriores.hidden=true;}
    try{
      const r=await controleSessao.requisitar(token=>enviar('/rest/v1/rpc/consultar_acompanhamento_reclamacao',{pedido_id:pedidoId,antes_versao:antes},token));
      if(!atual())return;
      if(r.status===401){exigirNovoLogin(contexto);return;}
      if(!r.ok)throw Error();
      const itens=await r.json();if(!atual())return;
      if(!Array.isArray(itens)||itens.length>51||!itens.every((x,i)=>x&&Number.isInteger(x.versao)&&x.versao>0&&x.versao<antes&&(!i||x.versao===itens[i-1].versao-1)&&['em_analise','concluida'].includes(x.status)&&descricaoReclamacaoValida(x.mensagem)&&dataReclamacaoValida(x.criado_em)))throw Error();
      if(reiniciar)estado.textContent='Situação: '+estadosReclamacao[itens[0]?.status||'aguardando_analise']+'.';
      else estado.textContent='Atualizações anteriores carregadas.';
      for(const item of itens.slice(0,50)){
        const registro=document.createElement('article');registro.append(texto('h4',estadosReclamacao[item.status]),texto('p',item.mensagem),dataReclamacao(item.criado_em));lista.append(registro);
      }
      cursor=itens[Math.min(itens.length,50)-1]?.versao||1;anteriores.hidden=itens.length<=50;
    }catch{if(atual())estado.textContent='Não foi possível consultar o acompanhamento. Tente novamente.';}
    finally{carregando=false;if(atual())bloquear(area,false);}
  }
}
function adicionarRespostaAdministrativa(card,item){
  const form=document.createElement('form'),status=document.createElement('select');
  const labelStatus=texto('label','Próxima situação do atendimento');labelStatus.append(status);
  for(const valor of item.status==='em_analise'?['em_analise','concluida']:['em_analise']){const o=texto('option',estadosReclamacao[valor]);o.value=valor;status.append(o);}
  const mensagem=document.createElement('textarea');mensagem.required=true;mensagem.minLength=10;mensagem.maxLength=2000;
  const labelMensagem=texto('label','Resposta da administração');labelMensagem.append(mensagem);
  const aviso=texto('p','A resposta ficará visível ao cliente e ao profissional. Não inclua documentos, dados bancários ou informações internas. Esta ação não movimenta dinheiro.');
  const enviarBotao=texto('button','Registrar atualização');enviarBotao.type='submit';
  const estado=texto('p','');estado.setAttribute('role','status');form.append(labelStatus,labelMensagem,aviso,enviarBotao,estado);card.append(form);
  let enviando=false;
  form.addEventListener('submit',async evento=>{
    evento.preventDefault();if(enviando||ocupado||!sessaoServicos||!descricaoReclamacaoValida(mensagem.value))return;
    if(!window.confirm('Registrar esta atualização no histórico do atendimento? Ela ficará visível às partes e não executará reembolso.'))return;
    const sessaoOriginal=sessaoServicos,versao=versaoReclamacoesAdmin;
    const atual=()=>form.isConnected&&sessaoServicos===sessaoOriginal&&versaoReclamacoesAdmin===versao;
    enviando=true;bloquear(form,true);estado.textContent='Registrando atualização…';
    try{
      const r=await controleSessao.requisitar(token=>enviar('/rest/v1/rpc/atualizar_acompanhamento_reclamacao',{pedido_id:item.solicitacao_id,operacao_id:crypto.randomUUID(),versao_esperada:item.versao,novo_status:status.value,mensagem:mensagem.value.trim()},token));
      if(!atual())return;
      if(r.status===401){exigirNovoLogin('reclamacoes-admin');return;}
      if(!r.ok)throw Error();
      const resultado=await r.json();if(!atual())return;
      if(!resultado||resultado.versao!==item.versao+1||resultado.status!==status.value)throw Error();
      mensagem.value='';await carregarReclamacoesAdmin(paginaReclamacoesAdmin);
    }catch{if(atual())estado.textContent='Não foi possível confirmar a atualização. Use Atualizar casos e consulte o histórico antes de tentar novamente. Nenhum envio será repetido automaticamente.';}
    // Conserva o formulário bloqueado após erro incerto; recarregar a fila obtém a revisão atual.
  });
}

let versaoReclamacoesAdmin=0,paginaReclamacoesAdmin=0;
function limparReclamacoesAdmin(){
  versaoReclamacoesAdmin++;paginaReclamacoesAdmin=0;
  const secao=elemento('reclamacoes-admin');if(!secao)return;
  elemento('lista-reclamacoes-admin').replaceChildren();elemento('status-reclamacoes-admin').textContent='';
  elemento('anterior-reclamacoes-admin').hidden=true;elemento('proxima-reclamacoes-admin').hidden=true;
  bloquear(secao,false);
}
async function carregarReclamacoesAdmin(pagina=0){
  if(ocupado||!sessaoServicos||!Number.isInteger(pagina)||pagina<0||pagina>10000)return;
  const sessaoOriginal=sessaoServicos,versao=++versaoReclamacoesAdmin;
  const secao=elemento('reclamacoes-admin'),lista=elemento('lista-reclamacoes-admin'),estado=elemento('status-reclamacoes-admin');
  const atual=()=>sessaoServicos===sessaoOriginal&&versaoReclamacoesAdmin===versao;
  lista.replaceChildren();elemento('anterior-reclamacoes-admin').hidden=true;elemento('proxima-reclamacoes-admin').hidden=true;
  bloquear(secao,true);estado.textContent='Consultando casos…';
  try{
    const r=await controleSessao.requisitar(token=>enviar('/rest/v1/rpc/listar_reclamacoes_administrativas',{pagina},token));
    if(!atual())return;
    if(r.status===401){exigirNovoLogin('reclamacoes-admin');return;}
    if(r.status===403){estado.textContent='Área reservada à conta de atendimento autorizada.';return;}
    if(!r.ok)throw Error();
    const linhas=await r.json();if(!atual())return;
    if(!Array.isArray(linhas)||linhas.length>51||!linhas.every(x=>x&&uuidReclamacao(x.solicitacao_id)&&Object.hasOwn(estadosReclamacao,x.status)&&Number.isInteger(x.versao)&&x.versao>=0&&((x.versao===0)===(x.status==='aguardando_analise'))&&typeof x.titulo==='string'&&x.titulo.length<=120&&Object.hasOwn(motivosReclamacao,x.motivo)&&descricaoReclamacaoValida(x.descricao)&&dataReclamacaoValida(x.criado_em)&&(!x.resposta||(descricaoReclamacaoValida(x.resposta.descricao)&&dataReclamacaoValida(x.resposta.criado_em)))))throw Error();
    for(const item of linhas.slice(0,50)){
      const card=document.createElement('article');card.append(texto('h3',item.titulo),texto('p','Referência: '+item.solicitacao_id),texto('p',motivosReclamacao[item.motivo]),texto('p',item.descricao),dataReclamacao(item.criado_em));
      if(item.resposta)card.append(texto('h4','Resposta do profissional'),texto('p',item.resposta.descricao),dataReclamacao(item.resposta.criado_em));
      else card.append(texto('p','Sem resposta do profissional registrada.'));
      card.append(texto('p','Situação: '+estadosReclamacao[item.status]+'.'));
      adicionarHistoricoReclamacao(card,item.solicitacao_id,'reclamacoes-admin');
      adicionarRespostaAdministrativa(card,item);
      lista.append(card);
    }
    paginaReclamacoesAdmin=pagina;
    estado.textContent=linhas.length?'Atualizações de atendimento disponíveis. Esta tela não executa estorno ou liberação de valores.':'Nenhum caso nesta página.';
    elemento('anterior-reclamacoes-admin').hidden=pagina===0;
    elemento('proxima-reclamacoes-admin').hidden=linhas.length<=50||pagina>=10000;
  }catch{if(atual())estado.textContent='Não foi possível consultar os casos. Tente novamente.';}
  finally{if(atual())bloquear(secao,false);}
}
elemento('abrir-reclamacoes-admin').addEventListener('click',()=>proteger('reclamacoes-admin'));
elemento('atualizar-reclamacoes-admin').addEventListener('click',()=>carregarReclamacoesAdmin(paginaReclamacoesAdmin));
elemento('anterior-reclamacoes-admin').addEventListener('click',()=>carregarReclamacoesAdmin(paginaReclamacoesAdmin-1));
elemento('proxima-reclamacoes-admin').addEventListener('click',()=>carregarReclamacoesAdmin(paginaReclamacoesAdmin+1));
