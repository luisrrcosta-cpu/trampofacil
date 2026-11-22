// Preparação interna para um futuro endpoint de homologação. Não cria cobranças.
// Os adaptadores devem validar o token no Auth e consultar o banco no servidor.
// Nunca usar identidade, valor ou status fornecidos pelo navegador como fonte.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class ErroPreparacaoPagamento extends Error {
  constructor(codigo, status, mensagem) { super(mensagem); this.codigo=codigo; this.status=status; }
}
const falhar=(codigo,status,mensagem)=>{throw new ErroPreparacaoPagamento(codigo,status,mensagem);};


// Registra somente categorias fixas. Nunca registrar mensagem, stack, URL ou credenciais.
export function classificarFalhaRegistro(erro) {
  const codigo = String(erro?.code || '');
  if (['22023','P0002','42501','42P01','42883','23505','28P01','28000','53300','57P01'].includes(codigo)) return codigo;
  const mensagem = String(erro?.message || '');
  if (/certificate|unknownissuer|self.signed|cert.*valid|tls/i.test(mensagem)) return 'TLS';
  if (/homologa|configurad/i.test(mensagem)) return 'CONFIGURACAO';
  if (/password authentication|authentication failed/i.test(mensagem)) return 'AUTENTICACAO_BANCO';
  if (/timeout|timed out/i.test(mensagem)) return 'TEMPO_CONEXAO';
  if (/connect|network|dns|hostname|ENOTFOUND|ECONN/i.test(mensagem + ' ' + codigo)) return 'CONEXAO';
  return 'OUTRA';
}

export function criarPreparadorPagamento({ambiente,autenticar,consultarSolicitacao,registrarPreparacao}={}) {
  if(ambiente!=='teste')throw new Error('A preparação de pagamentos está disponível somente em testes.');
  if(typeof autenticar!=='function'||typeof consultarSolicitacao!=='function')throw new Error('Configure os adaptadores de autenticação e consulta.');
  if(registrarPreparacao!==undefined&&typeof registrarPreparacao!=='function')throw new Error('Registro de preparação inválido.');
  return Object.freeze({
    async preparar({authorization,body}={}) {
      const token=/^Bearer ([^\s]+)$/.exec(authorization||'')?.[1];
      if(!token)falhar('NAO_AUTENTICADO',401,'Entre na sua conta para continuar.');
      let usuario;
      try{usuario=await autenticar(token);}catch{falhar('NAO_AUTENTICADO',401,'Entre novamente para continuar.');}
      if(!uuid.test(usuario?.id||'')||usuario.isAnonymous!==false)falhar('NAO_AUTENTICADO',401,'Uma conta identificada é necessária.');
      if(!body || typeof body!=='object' || Array.isArray(body) ||
        Object.keys(body).some(chave=>!['solicitacaoId','forma','parcelas'].includes(chave)) || !uuid.test(body.solicitacaoId||'')) {
        falhar('PEDIDO_INVALIDO',400,'Envie apenas a solicitação, forma de pagamento e parcelas.');
      }
      const parcelas=body.parcelas??1;
      if(!Number.isInteger(parcelas)||!(body.forma==='credito_avista'&&parcelas===1 || body.forma==='credito_parcelado'&&parcelas>=2&&parcelas<=10)) {
        falhar('FORMA_NAO_CONFIGURADA',422,'Forma ou parcelas sem condições confirmadas.');
      }
      let pedido;
      try{pedido=await consultarSolicitacao({id:body.solicitacaoId,usuarioId:usuario.id,token});}
      catch{falhar('CONSULTA_INDISPONIVEL',503,'Não foi possível conferir a solicitação. Tente novamente.');}
      // Mesma resposta para inexistente ou pertencente a outro cliente.
      if(!pedido||pedido.id!==body.solicitacaoId||pedido.cliente_usuario_id!==usuario.id) {
        falhar('SOLICITACAO_INDISPONIVEL',404,'Solicitação indisponível.');
      }
      if(pedido.status!=='aceita')falhar('ORCAMENTO_NAO_ACEITO',409,'O orçamento precisa estar aceito antes de preparar o pagamento.');
      const valor=pedido.valor_centavos;
      if(!Number.isSafeInteger(valor)||valor<100||valor>100000000||
        !uuid.test(pedido.profissional_usuario_id||'')||pedido.profissional_usuario_id===usuario.id||
        typeof pedido.atualizado_em!=='string'||!Number.isFinite(Date.parse(pedido.atualizado_em))) {
        falhar('ORCAMENTO_INVALIDO',409,'O orçamento salvo precisa ser conferido.');
      }
      const comissao=Math.floor((valor+5)/10);
      let preparacaoId;
      if(registrarPreparacao) {
        try {
          const registro=await registrarPreparacao({
            solicitacaoId:pedido.id,clienteUsuarioId:usuario.id,
            versaoOrcamento:pedido.atualizado_em,forma:body.forma,parcelas,
          });
          if(!uuid.test(registro?.id||''))throw new Error();
          preparacaoId=registro.id;
        } catch (erro) {
          console.error(JSON.stringify({evento:'falha_registro_preparacao',categoria:classificarFalhaRegistro(erro)}));
          if(erro?.code==='22023')falhar('PREPARACAO_DIVERGENTE',409,'Orçamento ou condições alteradas. Atualize a solicitação antes de continuar.');
          if(erro?.code==='P0002')falhar('SOLICITACAO_INDISPONIVEL',404,'Solicitação indisponível.');
          // Uma resposta perdida pode ter sido gravada. Não gerar nova chave
          // nem repetir automaticamente; a função atômica reconhece a repetição.
          falhar('REGISTRO_INDISPONIVEL',503,'Não foi possível confirmar a preparação. Tente novamente com as mesmas condições.');
        }
      }
      return Object.freeze({
        solicitacaoId:pedido.id,
        versaoOrcamento:pedido.atualizado_em,
        valorServicoCentavos:valor,
        profissionalCentavos:valor-comissao,
        comissaoCentavos:comissao,
        forma:body.forma,parcelas,
        preparacaoRegistrada:Boolean(preparacaoId),
        ...(preparacaoId?{preparacaoId}:{}),
        pagamentoHabilitado:false,
        pendencias:Object.freeze(['TAXAS_ONLINE','TRIBUTACAO','CREDENCIAIS_SANDBOX','PERSISTENCIA_IDEMPOTENTE','DIVISAO_E_REPASSES','WEBHOOK_VERIFICADO']),
      });
    },
  });
}
