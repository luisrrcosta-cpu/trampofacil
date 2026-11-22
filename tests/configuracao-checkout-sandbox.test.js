import test from 'node:test';
import assert from 'node:assert/strict';
import {validarNotificacoesCheckoutSandbox} from '../server/configuracao-checkout-sandbox.js';
const pagamento='https://exemplo.com/webhook/pagamento';
const checkout='https://exemplo.com/webhook/checkout';
test('permite notificação transacional separada e retorna configuração imutável',()=>{
  const r=validarNotificacoesCheckoutSandbox({ambiente:'sandbox',payment_notification_urls:[pagamento],notification_urls:[checkout]});
  assert.deepEqual(r,{payment_notification_urls:[pagamento],notification_urls:[checkout]});
  assert.ok(Object.isFrozen(r) && Object.isFrozen(r.payment_notification_urls));
});
test('notificação transacional é obrigatória e checkout é opcional',()=>{
  assert.deepEqual(validarNotificacoesCheckoutSandbox({ambiente:'sandbox',payment_notification_urls:[pagamento]}),{payment_notification_urls:[pagamento]});
  for(const value of [undefined,[],[checkout,checkout],['http://exemplo.com/webhook'],['https://localhost/a'],['https://127.0.0.1/a'],['https://u:p@exemplo.com/a'],['https://exemplo.com/a#b'],['https://exemplo.com/a b']]){
    assert.throws(()=>validarNotificacoesCheckoutSandbox({ambiente:'sandbox',payment_notification_urls:value}));
  }
});
test('rejeita produção, URLs iguais e listas de checkout inválidas',()=>{
  assert.throws(()=>validarNotificacoesCheckoutSandbox({ambiente:'producao',payment_notification_urls:[pagamento]}));
  assert.throws(()=>validarNotificacoesCheckoutSandbox({ambiente:'sandbox',payment_notification_urls:[pagamento],notification_urls:[pagamento]}));
  assert.throws(()=>validarNotificacoesCheckoutSandbox({ambiente:'sandbox',payment_notification_urls:[pagamento],notification_urls:[]}));
});

test('rejeita destinos internos, IPs e variantes equivalentes da mesma URL',()=>{
  for(const destino of ['https://192.168.1.1/webhook','https://10.0.0.2/hook',
    'https://[::1]/hook','https://servico.local/hook','https://servico.internal/hook',
    'https://localhost.localhost/hook','https://servidor/hook','https://localhost./hook','https://servico.local./hook','https://servico.internal./hook']) {
    assert.throws(()=>validarNotificacoesCheckoutSandbox({ambiente:'sandbox',payment_notification_urls:[destino]}),destino);
  }
  assert.throws(()=>validarNotificacoesCheckoutSandbox({ambiente:'sandbox',
    payment_notification_urls:['https://exemplo.com:443/webhook/pagamento'],
    notification_urls:[pagamento]}));
});

test('rejeita endereços IP com representações alternativas',()=>{
  for(const destino of ['https://2130706433/webhook','https://0x7f000001/webhook',
    'https://0177.0.0.1/webhook','https://[::ffff:127.0.0.1]/webhook',
    'https://8.8.8.8/webhook','https://[2001:db8::1]/webhook']) {
    assert.throws(()=>validarNotificacoesCheckoutSandbox({ambiente:'sandbox',
      payment_notification_urls:[destino]}),destino);
  }
});
