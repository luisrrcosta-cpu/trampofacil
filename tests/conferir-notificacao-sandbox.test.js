import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {criarConferenciaNotificacaoSandbox} from '../server/conferir-notificacao-sandbox.js';

const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const chavePublicaBase64=publicKey.export({format:'der',type:'spki'}).toString('base64');
const tentativa={ambiente:'sandbox',cobrancaId:'CHAR_TESTE-123',valorCentavos:15000};
const corpoBruto=Buffer.from(JSON.stringify({id:tentativa.cobrancaId,status:'PAID',amount:{value:1}}));
const assinatura=sign('sha256',corpoBruto,privateKey).toString('base64');
const consulta={ambiente:'sandbox',cobrancaId:tentativa.cobrancaId,valorCentavos:15000,statusProvedor:'PAID',pagoCentavos:15000,devolvidoCentavos:0};
const entrada={corpoBruto,cabecalhoAssinatura:assinatura,tentativa,referenciaEsperada:'ref-teste'};
const revisar={situacao:'revisao_necessaria',liberarRepasse:false};
test('consulta somente após assinatura válida e ignora valor declarado na mensagem',async()=>{
  let chamadas=0;
  const servico=criarConferenciaNotificacaoSandbox({ambiente:'sandbox',modeloAssinatura:'ecdsa',chavePublicaBase64,consultar:async esperado=>{
    chamadas++;assert.deepEqual(esperado,{cobrancaId:tentativa.cobrancaId,referenciaEsperada:'ref-teste',valorEsperadoCentavos:15000});return consulta;
  }});
  assert.equal((await servico.conferir(entrada)).situacao,'pagamento_observado');
  assert.equal(chamadas,1);
  assert.equal((await servico.conferir(entrada)).liberarRepasse,false);
});
test('assinatura adulterada impede consulta ao provedor',async()=>{
  let chamadas=0;const servico=criarConferenciaNotificacaoSandbox({ambiente:'sandbox',modeloAssinatura:'ecdsa',chavePublicaBase64,consultar:async()=>{chamadas++;return consulta;}});
  assert.deepEqual(await servico.conferir({...entrada,corpoBruto:Buffer.from(corpoBruto.toString()+' ')}),revisar);
  assert.equal(chamadas,0);
});
test('identificador da notificação divergente não consulta',async()=>{
  let chamadas=0;const corpo=Buffer.from(JSON.stringify({id:'CHAR_OUTRO'}));
  const servico=criarConferenciaNotificacaoSandbox({ambiente:'sandbox',modeloAssinatura:'ecdsa',chavePublicaBase64,consultar:async()=>{chamadas++;return consulta;}});
  assert.deepEqual(await servico.conferir({...entrada,corpoBruto:corpo,cabecalhoAssinatura:sign('sha256',corpo,privateKey).toString('base64')}),revisar);
  assert.equal(chamadas,0);
});
test('erro da consulta não vaza informação e não libera repasse',async()=>{
  const servico=criarConferenciaNotificacaoSandbox({ambiente:'sandbox',modeloAssinatura:'ecdsa',chavePublicaBase64,consultar:async()=>{throw new Error('segredo do provedor');}});
  assert.deepEqual(await servico.conferir(entrada),revisar);
});
test('produção não pode ser configurada',()=>assert.throws(()=>criarConferenciaNotificacaoSandbox({ambiente:'producao',modeloAssinatura:'ecdsa',chavePublicaBase64,consultar:async()=>consulta})));

test('JSON inválido mesmo assinado não consulta o provedor',async()=>{
  let chamadas=0;const corpo=Buffer.from('{');
  const servico=criarConferenciaNotificacaoSandbox({ambiente:'sandbox',modeloAssinatura:'ecdsa',chavePublicaBase64,consultar:async()=>{chamadas++;return consulta;}});
  assert.deepEqual(await servico.conferir({...entrada,corpoBruto:corpo,cabecalhoAssinatura:sign('sha256',corpo,privateKey).toString('base64')}),revisar);
  assert.equal(chamadas,0);
});
test('contexto de contratação inválido impede consulta',async()=>{
  let chamadas=0;const servico=criarConferenciaNotificacaoSandbox({ambiente:'sandbox',modeloAssinatura:'ecdsa',chavePublicaBase64,consultar:async()=>{chamadas++;return consulta;}});
  for(const alteracao of [{ambiente:'producao'},{valorCentavos:0},{valorCentavos:99},{valorCentavos:100000001},{valorCentavos:1.5},{cobrancaId:'CHAR_../fora'}]) {
    assert.deepEqual(await servico.conferir({...entrada,tentativa:{...tentativa,...alteracao}}),revisar);
  }
  assert.equal(chamadas,0);
});
test('consulta divergente não confirma pagamento',async()=>{
  const servico=criarConferenciaNotificacaoSandbox({ambiente:'sandbox',modeloAssinatura:'ecdsa',chavePublicaBase64,consultar:async()=>({...consulta,cobrancaId:'CHAR_OUTRO'})});
  assert.deepEqual(await servico.conferir(entrada),revisar);
});
test('pagamento apenas autorizado não é tratado como recebido',async()=>{
  const servico=criarConferenciaNotificacaoSandbox({ambiente:'sandbox',modeloAssinatura:'ecdsa',chavePublicaBase64,consultar:async()=>({...consulta,statusProvedor:'AUTHORIZED',pagoCentavos:0})});
  const resultado=await servico.conferir(entrada);
  assert.equal(resultado.situacao,'somente_autorizado');
  assert.equal(resultado.liberarRepasse,false);
});

test('modo token SHA256 aceita apenas o cabeçalho legado válido',async()=>{
  const {createHash}=await import('node:crypto');
  const tokenAutenticidade='token-ficticio';
  const cabecalhoAutenticidade=createHash('sha256').update(tokenAutenticidade).update('-').update(corpoBruto).digest('hex');
  let chamadas=0;
  const servico=criarConferenciaNotificacaoSandbox({ambiente:'sandbox',modeloAssinatura:'sha256-token',tokenAutenticidade,
    consultar:async()=>{chamadas++;return consulta;}});
  assert.equal((await servico.conferir({...entrada,cabecalhoAssinatura:undefined,cabecalhoAutenticidade})).situacao,'pagamento_observado');
  assert.equal(chamadas,1);
  assert.deepEqual(await servico.conferir({...entrada,cabecalhoAutenticidade}),revisar);
  assert.equal(chamadas,1);
});
test('configuração não aceita dois mecanismos de autenticação simultaneamente',()=>{
  assert.throws(()=>criarConferenciaNotificacaoSandbox({ambiente:'sandbox',modeloAssinatura:'sha256-token',
    tokenAutenticidade:'token',chavePublicaBase64,consultar:async()=>consulta}));
  assert.throws(()=>criarConferenciaNotificacaoSandbox({ambiente:'sandbox',modeloAssinatura:'ecdsa',
    tokenAutenticidade:'token',chavePublicaBase64,consultar:async()=>consulta}));
  assert.throws(()=>criarConferenciaNotificacaoSandbox({ambiente:'sandbox',modeloAssinatura:'qualquer',
    chavePublicaBase64,consultar:async()=>consulta}));
});

test('ECDSA rejeita notificação com os dois cabeçalhos',async()=>{
  let chamadas=0;
  const servico=criarConferenciaNotificacaoSandbox({ambiente:'sandbox',modeloAssinatura:'ecdsa',
    chavePublicaBase64,consultar:async()=>{chamadas++;return consulta;}});
  assert.deepEqual(await servico.conferir({...entrada,cabecalhoAutenticidade:'a'.repeat(64)}),revisar);
  assert.equal(chamadas,0);
});
test('SHA256-token rejeita notificação com os dois cabeçalhos',async()=>{
  const {createHash}=await import('node:crypto');
  let chamadas=0;
  const tokenAutenticidade='token-ficticio';
  const cabecalhoAutenticidade=createHash('sha256').update(tokenAutenticidade).update('-').update(corpoBruto).digest('hex');
  const servico=criarConferenciaNotificacaoSandbox({ambiente:'sandbox',modeloAssinatura:'sha256-token',
    tokenAutenticidade,consultar:async()=>{chamadas++;return consulta;}});
  assert.deepEqual(await servico.conferir({...entrada,cabecalhoAutenticidade}),revisar);
  assert.equal(chamadas,0);
});

test('modelo de assinatura omitido é rejeitado por padrão',()=>{
  assert.throws(()=>criarConferenciaNotificacaoSandbox({ambiente:'sandbox',chavePublicaBase64,consultar:async()=>consulta}));
});

test('evento de checkout CHEC assinado não é confundido com pagamento CHAR',async()=>{
  let chamadas=0;
  const corpo=Buffer.from(JSON.stringify({id:'CHEC_120301FA-8B8B-4C25-B07D-A4541EB78EB5',status:'EXPIRED'}));
  const servico=criarConferenciaNotificacaoSandbox({ambiente:'sandbox',modeloAssinatura:'ecdsa',
    chavePublicaBase64,consultar:async()=>{chamadas++;return consulta;}});
  assert.deepEqual(await servico.conferir({...entrada,corpoBruto:corpo,
    cabecalhoAssinatura:sign('sha256',corpo,privateKey).toString('base64')}),revisar);
  assert.equal(chamadas,0);
});

test('webhook assinado com objeto sem id ou id de tipo inválido não consulta',async()=>{
  let chamadas=0;
  const servico=criarConferenciaNotificacaoSandbox({ambiente:'sandbox',modeloAssinatura:'ecdsa',
    chavePublicaBase64,consultar:async()=>{chamadas++;return consulta;}});
  for(const mensagem of [{status:'PAID'},{id:null},{id:123},{id:['CHAR_TESTE-123']},{id:{value:'CHAR_TESTE-123'}}]) {
    const corpo=Buffer.from(JSON.stringify(mensagem));
    assert.deepEqual(await servico.conferir({...entrada,corpoBruto:corpo,
      cabecalhoAssinatura:sign('sha256',corpo,privateKey).toString('base64')}),revisar);
  }
  assert.equal(chamadas,0);
});
