'use strict';
let versaoAvisosAtendimento=0,cursorAvisosAtendimento=null,carregandoAvisosAtendimento=false;
const titulosAvisoContratacao=Object.freeze({solicitada:'Nova solicitação',proposta:'Proposta recebida ou atualizada',aceita:'Proposta aceita',em_andamento:'Serviço em andamento',entregue:'Entrega informada',concluida:'Serviço concluído',cancelada:'Solicitação cancelada'});
const uuidAviso=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const dataAvisoValida=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
function horarioAviso(v){const n=document.createElement('time');n.dateTime=new Date(v).toISOString();n.textContent=new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(v))+' (Brasília)';return n;}
function limparAvisosAtendimento(){
 versaoAvisosAtendimento++;cursorAvisosAtendimento=null;carregandoAvisosAtendimento=false;
 const secao=elemento('avisos-atendimento');if(!secao)return;
 elemento('lista-avisos-atendimento').replaceChildren();elemento('status-avisos-atendimento').textContent='';elemento('resumo-avisos-atendimento').textContent='';elemento('mais-avisos-atendimento').hidden=true;bloquear(secao,false);
}
function atualizarResumoAvisos(){
 const cards=elemento('lista-avisos-atendimento').querySelectorAll(':scope > article');
 const naoLidos=Array.from(cards).filter(c=>c.dataset.lido==='false').length;
 elemento('resumo-avisos-atendimento').textContent=cards.length?naoLidos+' não lido(s) entre os '+cards.length+' avisos exibidos.':'';
}
async function carregarAvisosAtendimento(anteriores=false){
 if(ocupado||carregandoAvisosAtendimento||!sessaoServicos||anteriores&&!cursorAvisosAtendimento)return;
 const sessaoOriginal=sessaoServicos,versao=++versaoAvisosAtendimento;
 const secao=elemento('avisos-atendimento'),lista=elemento('lista-avisos-atendimento'),estado=elemento('status-avisos-atendimento'),mais=elemento('mais-avisos-atendimento');
 const atual=()=>sessaoServicos===sessaoOriginal&&versaoAvisosAtendimento===versao;
 if(!anteriores){lista.replaceChildren();cursorAvisosAtendimento=null;elemento('resumo-avisos-atendimento').textContent='';}
 mais.hidden=true;carregandoAvisosAtendimento=true;bloquear(secao,true);estado.textContent='Consultando avisos…';
 try{
  const r=await controleSessao.requisitar(token=>enviar('/rest/v1/rpc/listar_avisos_atendimento',cursorAvisosAtendimento||{},token));
  if(!atual())return;
  if(r.status===401){exigirNovoLogin('avisos-atendimento');return;}
  if(!r.ok)throw Error();
  const itens=await r.json();if(!atual())return;
  const chave=x=>x.tipo+':'+x.evento_id;
  if(!Array.isArray(itens)||itens.length>51||new Set(itens.map(chave)).size!==itens.length||!itens.every(x=>x&&uuidAviso(x.evento_id)&&uuidAviso(x.solicitacao_id)&&['administracao','resposta_profissional','contratacao'].includes(x.tipo)&&typeof x.titulo==='string'&&x.titulo.length<=120&&typeof x.mensagem==='string'&&x.mensagem.trim().length>=10&&x.mensagem.length<=2000&&dataAvisoValida(x.criado_em)&&(x.lido_em===null||dataAvisoValida(x.lido_em))&&(x.tipo==='administracao'?['em_analise','concluida'].includes(x.status):x.tipo==='contratacao'?Object.hasOwn(titulosAvisoContratacao,x.status):x.status===null)))throw Error();
  for(const item of itens.slice(0,50)){
   if(Array.from(lista.children).some(c=>c.dataset.aviso===chave(item)))throw Error();
   const card=document.createElement('article');card.dataset.aviso=chave(item);card.dataset.lido=String(Boolean(item.lido_em));
   const titulo=item.tipo==='contratacao'?titulosAvisoContratacao[item.status]:item.tipo==='resposta_profissional'?'Resposta do profissional':item.status==='concluida'?'Atendimento concluído':'Atualização da administração';
   const leitura=texto('p',item.lido_em?'Lido':'Não lido');
   const marcar=botaoAcao('Marcar como lido',()=>marcarLido(item,card,leitura,marcar));marcar.hidden=Boolean(item.lido_em);
   const mensagem=texto('p',item.mensagem);mensagem.className='texto-mensagem';
   card.append(texto('h3',titulo+' — '+item.titulo),horarioAviso(item.criado_em),mensagem,leitura,marcar,botaoAcao('Ver solicitação',()=>retornarParaSolicitacoes(item.solicitacao_id)));lista.append(card);
  }
  const ultimo=itens[Math.min(itens.length,50)-1];cursorAvisosAtendimento=ultimo?{antes_em:ultimo.criado_em,antes_tipo:ultimo.tipo,antes_id:ultimo.evento_id}:null;
  mais.hidden=itens.length<=50;estado.textContent=lista.children.length?'Avisos consultados. Use Atualizar avisos para buscar novidades.':'Você ainda não tem avisos de atendimento.';atualizarResumoAvisos();
 }catch{if(atual())estado.textContent='Não foi possível consultar os avisos. Use Atualizar avisos para tentar novamente.';}
 finally{if(atual()){carregandoAvisosAtendimento=false;bloquear(secao,false);}}
}
async function marcarLido(item,card,leitura,botao){
 if(ocupado||carregandoAvisosAtendimento||!sessaoServicos||botao.disabled||item.lido_em)return;
 const sessaoOriginal=sessaoServicos,versao=versaoAvisosAtendimento;
 const atual=()=>card.isConnected&&sessaoServicos===sessaoOriginal&&versaoAvisosAtendimento===versao;
 botao.disabled=true;leitura.textContent='Registrando leitura…';
 try{
  const r=await controleSessao.requisitar(token=>enviar('/rest/v1/rpc/marcar_aviso_atendimento_lido',{tipo:item.tipo,evento_id:item.evento_id},token));
  if(!atual())return;
  if(r.status===401){exigirNovoLogin('avisos-atendimento');return;}
  if(!r.ok)throw Error();
  const hora=await r.json();if(!atual())return;if(!dataAvisoValida(hora))throw Error();
  item.lido_em=hora;card.dataset.lido='true';leitura.textContent='Lido';botao.hidden=true;atualizarResumoAvisos();
 }catch{if(atual())leitura.textContent='Não foi possível confirmar a leitura. Atualize os avisos para consultar; nenhum envio será repetido automaticamente.';}
}
elemento('abrir-avisos-atendimento').addEventListener('click',()=>proteger('avisos-atendimento'));
elemento('atualizar-avisos-atendimento').addEventListener('click',()=>carregarAvisosAtendimento());
elemento('mais-avisos-atendimento').addEventListener('click',()=>carregarAvisosAtendimento(true));
