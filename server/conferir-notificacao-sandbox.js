import {verificarAssinaturaWebhook} from './verificar-assinatura-webhook.js';
import {verificarAutenticidadeLegada} from './verificar-autenticidade-legada.js';
import {conferirConsultaPagBank} from './conferencia-pagbank.js';

// Pipeline interno, sem rota HTTP, gravação no banco ou liberação de repasses.
// O contexto esperado deve vir do banco após autenticação/autorização, nunca do webhook.
export function criarConferenciaNotificacaoSandbox({ambiente, modeloAssinatura, chavePublicaBase64, tokenAutenticidade, consultar}={}) {
  if (ambiente!=='sandbox' || !['ecdsa','sha256-token'].includes(modeloAssinatura) ||
      (modeloAssinatura==='ecdsa' && (typeof chavePublicaBase64!=='string' || tokenAutenticidade!==undefined)) ||
      (modeloAssinatura==='sha256-token' && (typeof tokenAutenticidade!=='string' || chavePublicaBase64!==undefined)) ||
      typeof consultar!=='function')
    throw new Error('Conferência restrita ao sandbox.');
  return Object.freeze({
    async conferir({corpoBruto,cabecalhoAssinatura,cabecalhoAutenticidade,tentativa,referenciaEsperada}={}) {
      const revisar=()=>Object.freeze({situacao:'revisao_necessaria',liberarRepasse:false});
      const assinaturaValida=modeloAssinatura==='ecdsa'
        ? cabecalhoAutenticidade===undefined && verificarAssinaturaWebhook({corpoBruto,cabecalhoAssinatura,chavePublicaBase64})
        : cabecalhoAssinatura===undefined && verificarAutenticidadeLegada({corpoBruto,cabecalhoAutenticidade,token:tokenAutenticidade});
      if (!assinaturaValida) return revisar();
      if (!tentativa || tentativa.ambiente!=='sandbox' ||
          !/^CHAR_[A-Za-z0-9-]{1,100}$/.test(tentativa.cobrancaId || '') ||
          !Number.isSafeInteger(tentativa.valorCentavos) || tentativa.valorCentavos<100 || tentativa.valorCentavos>100000000 ||
          typeof referenciaEsperada!=='string' || referenciaEsperada.length<1 || referenciaEsperada.length>64 || /[\s\u0000-\u001f\u007f]/.test(referenciaEsperada)) return revisar();
      let mensagem;
      try {mensagem=JSON.parse(corpoBruto.toString('utf8'));}
      catch {return revisar();}
      // A mensagem autenticada é apenas um aviso; nunca fornece valor ou estado financeiro.
      if (!mensagem || typeof mensagem!=='object' || Array.isArray(mensagem)) return revisar();
      // Checkout PagBank pode notificar um pedido ORDE com cobranças em charges[].
      // Um checkout CHEC não é pagamento. Não escolher cobrança por status ou valor.
      const idDireto=mensagem.id===tentativa.cobrancaId && !Object.hasOwn(mensagem,'charges');
      const cobrancas=Array.isArray(mensagem.charges) ? mensagem.charges : [];
      const idEmPedido=typeof mensagem.id==='string' && /^ORDE_[A-Za-z0-9-]{1,100}$/.test(mensagem.id) &&
        cobrancas.length===1 && cobrancas[0]?.id===tentativa.cobrancaId;
      if (!idDireto && !idEmPedido) return revisar();
      try {
        const consulta=await consultar({cobrancaId:tentativa.cobrancaId,referenciaEsperada,
          valorEsperadoCentavos:tentativa.valorCentavos});
        return conferirConsultaPagBank(consulta,tentativa);
      } catch {return revisar();}
    },
  });
}
