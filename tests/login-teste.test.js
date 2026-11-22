import assert from 'node:assert/strict';
import test from 'node:test';
import { criarTesteLogin } from '../login-teste-core.js';
const config = { ambiente: 'homologacao', url: 'https://asdszqtpydiowgerxwee.supabase.co', chavePublicavel: 'sb_publishable_teste' };
const email = 'teste@example.com';
const uuid = '00000000-0000-4000-8000-000000000001';
const resposta = (dados, status = 200) => new Response(JSON.stringify(dados), { status });

test('diagnóstico recusa produção e chaves administrativas antes de qualquer chamada', () => {
  for (const c of [null, {...config, url:'https://producao.invalid'}, {...config, ambiente:'producao'}, {...config,chavePublicavel:'sb_secret_teste'}]) {
    assert.throws(() => criarTesteLogin(c, () => { throw Error('não deve chamar'); }));
  }
});
test('envio é explícito, sem criação de conta, cookies ou redirects', async () => {
  const chamadas=[];
  const cliente=criarTesteLogin(config, async (...args) => { chamadas.push(args); return resposta({}); });
  await assert.rejects(cliente.solicitar('inválido'));
  assert.equal(chamadas.length,0);
  await cliente.solicitar(email);
  assert.equal(chamadas.length,1);
  assert.equal(chamadas[0][0],config.url+'/auth/v1/otp');
  assert.deepEqual(JSON.parse(chamadas[0][1].body), {email,create_user:false});
  assert.equal(chamadas[0][1].redirect,'error');
  assert.equal(chamadas[0][1].credentials,'omit');
});
test('verificação confirma identidade no Auth e encerra somente a sessão local sem expor tokens', async () => {
  const chamadas=[];
  const fila=[resposta({access_token:'token-ficticio',refresh_token:'nao-expor'}), resposta({id:uuid,email}), resposta({})];
  const cliente=criarTesteLogin(config,async (...args)=>{chamadas.push(args);return fila.shift();});
  assert.deepEqual(await cliente.verificar(email,'123456'),{identidadeConfirmada:true,sessaoEncerrada:true});
  assert.deepEqual(JSON.parse(chamadas[0][1].body),{email,token:'123456',type:'email'});
  assert.equal(chamadas[1][1].method,'GET');
  assert.equal(chamadas[1][1].headers.Authorization,'Bearer token-ficticio');
  assert.equal(chamadas[2][0],config.url+'/auth/v1/logout?scope=local');
});
test('identidade divergente e erro de consulta também encerram a sessão de teste', async () => {
  for(const usuario of [resposta({id:uuid,email:'outra@example.com'}),resposta({},401)]){
    const urls=[];const fila=[resposta({access_token:'ficticio'}),usuario,resposta({})];
    const cliente=criarTesteLogin(config,async u=>{urls.push(u);return fila.shift();});
    await assert.rejects(cliente.verificar(email,'123456'));
    assert.equal(urls.at(-1),config.url+'/auth/v1/logout?scope=local');
  }
});
test('código inválido não chama API; falha ao encerrar nunca retorna sucesso; erros não vazam resposta',async()=>{
  const cliente=criarTesteLogin(config,async()=>{throw Error('não chamar');});
  await assert.rejects(cliente.verificar(email,'12345'),/6 ou 8/);
  const fila=[resposta({access_token:'ficticio'}),resposta({id:uuid,email}),resposta({secret:'nao-expor'},500)];
  await assert.rejects(criarTesteLogin(config,async()=>fila.shift()).verificar(email,'123456'),/encerramento não foi confirmado/);
  await assert.rejects(criarTesteLogin(config,async()=>resposta({secret:'nao-expor'},400)).solicitar(email),e=>!e.message.includes('nao-expor'));
});

 test('aceita oito dígitos completos e rejeita sete ou nove antes de enviar',async()=>{
 const chamadas=[]; const fila=[resposta({access_token:'ficticio'}),resposta({id:uuid,email}),resposta({})];
 const cliente=criarTesteLogin(config,async(u,o)=>{chamadas.push([u,o]);return fila.shift();});
 for(const codigo of ['1234567','123456789','abcdefgh'])await assert.rejects(cliente.verificar(email,codigo));
 assert.equal(chamadas.length,0);
 await cliente.verificar(email,'12345678');
 assert.equal(JSON.parse(chamadas[0][1].body).token,'12345678');
 });
