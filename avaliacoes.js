'use strict';

function adicionarAvaliacaoServico(card, pedido, cliente) {
  if (pedido.status !== 'concluida') return;
  const area = document.createElement('div');
  area.append(texto('h4', `Avaliação do serviço — ${pedido.titulo}`));
  const estado = texto('p', ''); estado.setAttribute('role','status');
  const form = document.createElement('form'); form.hidden = true;
  const label = texto('label', 'Sua nota (1 a 5)');
  const nota = document.createElement('select'); nota.required = true;
  for (const [valor,rotulo] of [['','Escolha a nota'],['1','1 — Muito insatisfeito'],['2','2 — Insatisfeito'],['3','3 — Regular'],['4','4 — Satisfeito'],['5','5 — Muito satisfeito']]) {
    const opcao = texto('option',rotulo); opcao.value=valor; nota.append(opcao);
  }
  label.append(nota);
  const enviarNota = texto('button','Registrar avaliação'); enviarNota.type='submit';
  form.append(label,texto('p','Sua nota será visível para você e para o profissional. Depois de registrada, não poderá ser alterada por esta tela.'),enviarNota);
  let carregando=false,incerta=false,registrada=false;
  const consultar=botaoAcao('Consultar avaliação do serviço',()=>executar());
  area.append(consultar,form,estado); card.append(area);
  form.addEventListener('submit',evento=>{
    evento.preventDefault();
    if (carregando || registrada || incerta || !cliente || !/^[1-5]$/.test(nota.value)) return;
    const valor=Number(nota.value);
    if (!window.confirm(`Registrar nota ${valor} de 5 para “${pedido.titulo}”? Ela será visível para você e para o profissional.`)) return;
    executar(valor);
  });
  async function executar(valor) {
    if (ocupado || carregando || !sessaoServicos) return;
    const sessaoOriginal=sessaoServicos,versaoOriginal=versaoPedidos;
    if (![pedido.cliente_usuario_id,pedido.profissional_usuario_id].includes(sessaoOriginal.usuario)) return;
    if (valor!==undefined && (!cliente || sessaoOriginal.usuario!==pedido.cliente_usuario_id || incerta || registrada || !Number.isInteger(valor) || valor<1 || valor>5)) return;
    const atual=()=>sessaoServicos===sessaoOriginal && versaoPedidos===versaoOriginal;
    carregando=true;form.hidden=true;bloquear(elemento('solicitacoes'),true);
    estado.textContent=valor===undefined?'Consultando avaliação…':'Registrando avaliação…';
    try {
      if (valor!==undefined) {
        incerta=true;
        const escrita=await controleSessao.requisitar(token=>enviar('/rest/v1/avaliacoes_servico',{solicitacao_id:pedido.id,nota:valor},token,'return=minimal'));
        if (!atual()) return;
        if (escrita.status===401) {exigirNovoLogin('solicitacoes');return;}
        if (!escrita.ok) throw Error();
      }
      const r=await controleSessao.requisitar(token=>enviar('/rest/v1/avaliacoes_servico?'+new URLSearchParams({solicitacao_id:'eq.'+pedido.id,select:'solicitacao_id,cliente_usuario_id,nota,criado_em',limit:'1'}),undefined,token,undefined,'GET'));
      if (!atual()) return;
      if (r.status===401) {exigirNovoLogin('solicitacoes');return;}
      if (!r.ok) throw Error();
      const linhas=await r.json(); if(!atual())return;
      if(!Array.isArray(linhas)||linhas.length>1)throw Error();
      if(!linhas.length) {
        estado.textContent=incerta?'O registro ainda não foi confirmado. Consulte novamente; a avaliação não será reenviada automaticamente.':'Este serviço ainda não tem avaliação.';
        form.hidden=!cliente||incerta;return;
      }
      const a=linhas[0];
      if(a.solicitacao_id!==pedido.id||a.cliente_usuario_id!==pedido.cliente_usuario_id||!Number.isInteger(a.nota)||a.nota<1||a.nota>5||typeof a.criado_em!=='string'||!Number.isFinite(Date.parse(a.criado_em)))throw Error();
      registrada=true;incerta=false;
      estado.textContent=`Avaliação registrada: ${a.nota} de 5. Visível somente para as partes deste serviço.`;
    }catch{
      if(atual())estado.textContent=incerta?'Não foi possível confirmar o registro. Consulte a avaliação antes de qualquer nova ação.':'Não foi possível consultar a avaliação. Tente novamente.';
    }finally{
      carregando=false;
      if(atual())bloquear(elemento('solicitacoes'),false);
    }
  }
}
