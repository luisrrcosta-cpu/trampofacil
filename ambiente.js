'use strict';

// Lista explícita: uma configuração acidental de produção não inicia a API.
function validarAmbiente(config) {
  const urlPermitida = 'https://asdszqtpydiowgerxwee.supabase.co';
  if (!config || config.ambiente !== 'homologacao' || config.url !== urlPermitida ||
      typeof config.chavePublicavel !== 'string' ||
      !/^sb_publishable_[A-Za-z0-9_-]{1,450}$/.test(config.chavePublicavel)) {
    return Object.freeze({ integrado: false, autenticacaoPronta: false });
  }
  return Object.freeze({ integrado: true, autenticacaoPronta: config.autenticacaoPronta === true });
}
