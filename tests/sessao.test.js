import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import test from 'node:test';

const criar = runInNewContext((await readFile(new URL('../sessao.js',import.meta.url),'utf8'))+';criarControleSessao');
const adiar=()=>{let concluir;const promessa=new Promise(r=>concluir=r);return {promessa,concluir};};
const resposta=(dados,status=200)=>({ok:status===200,status,json:async()=>dados});

test('sem sessão não envia requisição privada',async()=>{
  let envios=0;const controle=criar();
  await assert.rejects(controle.requisitar(()=>{envios++;}),/Entre na sua conta/);
  assert.equal(envios,0);
});
test('sessão atual recebe apenas a resposta autorizada para seu token',async()=>{
  const controle=criar();controle.alterar({token:'ficticio-a'});
  const resultado=await controle.requisitar(async token=>{assert.equal(token,'ficticio-a');return resposta({texto:'teste'});});
  assert.equal(resultado.status,200);assert.equal(resultado.ok,true);
  assert.deepEqual(await resultado.json(),{texto:'teste'});
});
test('resposta de mensagens iniciada antes da saída não volta para a tela',async()=>{
  const controle=criar(),rede=adiar();controle.alterar({token:'ficticio-a'});
  const chamada=controle.requisitar(()=>rede.promessa);
  controle.alterar(undefined);rede.concluir(resposta([{texto:'rascunho privado'}]));
  await assert.rejects(chamada,/sessão mudou/);
});
test('troca de conta durante a leitura do corpo descarta dados do cliente anterior',async()=>{
  const controle=criar(),corpo=adiar();controle.alterar({token:'ficticio-a'});
  const resultado=await controle.requisitar(async()=>({ok:true,status:200,json:()=>corpo.promessa}));
  const leitura=resultado.json();controle.alterar({token:'ficticio-b'});
  corpo.concluir([{titulo:'Solicitação privada A'}]);await assert.rejects(leitura,/sessão mudou/);
});
test('nova entrada da mesma conta também invalida resposta anterior',async()=>{
  const controle=criar();controle.alterar({token:'ficticio-a'});
  const resultado=await controle.requisitar(async()=>resposta([]));
  controle.alterar({token:'ficticio-a'});await assert.rejects(resultado.json(),/sessão mudou/);
});
test('401 antigo não é entregue à nova sessão para provocar saída indevida',async()=>{
  const controle=criar(),rede=adiar();controle.alterar({token:'ficticio-a'});
  const antiga=controle.requisitar(()=>rede.promessa);
  controle.alterar({token:'ficticio-b'});rede.concluir(resposta(null,401));
  await assert.rejects(antiga,/sessão mudou/);
  const nova=await controle.requisitar(async token=>resposta(token));
  assert.equal(await nova.json(),'ficticio-b');
});
test('falha de envio não repete automaticamente uma mensagem',async()=>{
  const controle=criar();controle.alterar({token:'ficticio-a'});let envios=0;
  await assert.rejects(controle.requisitar(async()=>{envios++;throw new Error('rede indisponível');}),/rede indisponível/);
  assert.equal(envios,1);
});
