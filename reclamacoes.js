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
      estado.textContent='Registro recebido para análise. Ainda não há decisão de reembolso ou confirmação de bloqueio bancário.';
      if(dados){relato.value='';categoria.value='';}
      form.hidden=cliente||respostaRegistrada;
    }catch{
      if(atual())estado.textContent=incerto?'Não foi possível confirmar o registro. Consulte novamente antes de tentar registrar; nenhum envio será repetido automaticamente.':'Não foi possível consultar a reclamação. Tente novamente.';
    }finally{
      carregando=false;if(atual())bloquear(elemento('solicitacoes'),false);
    }
  }
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
    if(!Array.isArray(linhas)||linhas.length>51||!linhas.every(x=>x&&uuidReclamacao(x.solicitacao_id)&&typeof x.titulo==='string'&&x.titulo.length<=120&&Object.hasOwn(motivosReclamacao,x.motivo)&&descricaoReclamacaoValida(x.descricao)&&dataReclamacaoValida(x.criado_em)&&(!x.resposta||(descricaoReclamacaoValida(x.resposta.descricao)&&dataReclamacaoValida(x.resposta.criado_em)))))throw Error();
    for(const item of linhas.slice(0,50)){
      const card=document.createElement('article');card.append(texto('h3',item.titulo),texto('p','Referência: '+item.solicitacao_id),texto('p',motivosReclamacao[item.motivo]),texto('p',item.descricao),dataReclamacao(item.criado_em));
      if(item.resposta)card.append(texto('h4','Resposta do profissional'),texto('p',item.resposta.descricao),dataReclamacao(item.resposta.criado_em));
      else card.append(texto('p','Sem resposta do profissional registrada.'));
      lista.append(card);
    }
    paginaReclamacoesAdmin=pagina;
    estado.textContent=linhas.length?'Casos registrados para análise. Esta tela não executa decisão, estorno ou liberação de valores.':'Nenhum caso nesta página.';
    elemento('anterior-reclamacoes-admin').hidden=pagina===0;
    elemento('proxima-reclamacoes-admin').hidden=linhas.length<=50||pagina>=10000;
  }catch{if(atual())estado.textContent='Não foi possível consultar os casos. Tente novamente.';}
  finally{if(atual())bloquear(secao,false);}
}
elemento('abrir-reclamacoes-admin').addEventListener('click',()=>proteger('reclamacoes-admin'));
elemento('atualizar-reclamacoes-admin').addEventListener('click',()=>carregarReclamacoesAdmin(paginaReclamacoesAdmin));
elemento('anterior-reclamacoes-admin').addEventListener('click',()=>carregarReclamacoesAdmin(paginaReclamacoesAdmin-1));
elemento('proxima-reclamacoes-admin').addEventListener('click',()=>carregarReclamacoesAdmin(paginaReclamacoesAdmin+1));
