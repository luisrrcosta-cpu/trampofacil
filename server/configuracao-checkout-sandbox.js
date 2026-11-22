// Validação local da configuração de notificações do Checkout PagBank.
// Não faz chamadas HTTP, não cria checkout e não habilita pagamentos.
export function validarNotificacoesCheckoutSandbox({ambiente,notification_urls,payment_notification_urls}={}) {
  if (ambiente!=='sandbox') throw new Error('Configuração permitida apenas no sandbox.');
  const validar=(urls)=>{
    if (!Array.isArray(urls) || urls.length!==1 || typeof urls[0]!=='string') return false;
    const endereco=urls[0];
    if (endereco.length<5 || endereco.length>100 || /[\\\s]/.test(endereco)) return false;
    try {
      const url=new URL(endereco);
      return url.protocol==='https:' && !!url.hostname && !url.username && !url.password &&
        !url.hash && !['localhost','127.0.0.1','::1'].includes(url.hostname.toLowerCase()) &&
        !url.hostname.endsWith('.localhost');
    } catch {return false;}
  };
  if (!validar(payment_notification_urls) ||
      (notification_urls!==undefined && !validar(notification_urls)) ||
      (notification_urls!==undefined && notification_urls[0]===payment_notification_urls[0])) {
    throw new Error('URLs de notificação inválidas ou não separadas.');
  }
  return Object.freeze({
    payment_notification_urls:Object.freeze([...payment_notification_urls]),
    ...(notification_urls===undefined?{}:{notification_urls:Object.freeze([...notification_urls])}),
  });
}
