import assert from 'node:assert/strict';
import test from 'node:test';
import {criarPreparadorPagamento} from '../server/preparar-pagamento.js';
const cliente='11111111-1111-4111-8111-111111111111';
const profissional='22222222-2222-4222-8222-222222222222';
const terceiro='33333333-3333-4333-8333-333333333333';
const id='44444444-4444-4444-8444-444444444444';
const pedido={id,cliente_usuario_id:cliente,profissional_usuario_id:profissional,status:'aceita',valor_centavos:10000,atualizado_em:'2026-11-19T10:00:00Z'};
const entrada={authorization:'Bearer token-ficticio',body:{solicitacaoId:id,forma:'credito_parcelado',parcelas:10}};
const preparar=(opcoes={})=>criarPreparadorPagamento({ambiente:'teste',autenticar:async token=>{assert.equal(token,'token-ficticio');return {id:cliente,isAnonymous:false};},consultarSolicitacao:async()=>pedido,...opcoes});
const rejeita=(promessa,codigo,status)=>assert.rejects(promessa,e=>e.codigo===codigo&&e.status===status);

test('preparação usa orçamento salvo e preserva divisão 90/10 sem habilitar cobrança',async()=>{
  const r=await preparar({consultarSolicitacao:async consulta=>{assert.equal(consulta.id,id);assert.equal(consulta.usuarioId,cliente);return pedido;}}).preparar(entrada);
  assert.equal(r.valorServicoCentavos,10000);assert.equal(r.profissionalCentavos,9000);assert.equal(r.comissaoCentavos,1000);
  assert.equal(r.versaoOrcamento,pedido.atualizado_em);assert.equal(r.pagamentoHabilitado,false);
  assert.equal('checkoutUrl' in r,false);assert.equal('token' in r,false);assert.equal('profissional_usuario_id' in r,false);
  assert.ok(r.pendencias.includes('TRIBUTACAO'));assert.ok(r.pendencias.includes('TAXAS_ONLINE'));
});
test('não consulta orçamento sem token validado ou com conta anônima',async()=>{
  let consultas=0;const consultarSolicitacao=async()=>{consultas++;return pedido;};
  await rejeita(preparar({consultarSolicitacao}).preparar({...entrada,authorization:''}),'NAO_AUTENTICADO',401);
  await rejeita(preparar({consultarSolicitacao,autenticar:async()=>{throw new Error('detalhes privados');}}).preparar(entrada),'NAO_AUTENTICADO',401);
  await rejeita(preparar({consultarSolicitacao,autenticar:async()=>({id:cliente,isAnonymous:true})}).preparar(entrada),'NAO_AUTENTICADO',401);
  assert.equal(consultas,0);
});
test('profissional e terceiro não preparam pagamento em nome do cliente',async()=>{
  for(const ator of [profissional,terceiro])await rejeita(preparar({autenticar:async()=>({id:ator,isAnonymous:false})}).preparar(entrada),'SOLICITACAO_INDISPONIVEL',404);
  await rejeita(preparar({consultarSolicitacao:async()=>null}).preparar(entrada),'SOLICITACAO_INDISPONIVEL',404);
});
test('não aceita valor, comissão, identidade ou habilitação enviados pelo navegador',async()=>{
  for(const extra of [{valor_centavos:1},{comissaoCentavos:0},{usuarioId:terceiro},{pagamentoHabilitado:true},{taxasOnlineConfirmadas:true},{status:'aceita'}]) {
    await rejeita(preparar().preparar({...entrada,body:{...entrada.body,...extra}}),'PEDIDO_INVALIDO',400);
  }
});
test('contratação ainda não aceita ou já encerrada não gera preparação',async()=>{
  for(const status of ['solicitada','proposta','em_andamento','entregue','concluida','cancelada','pago']) {
    await rejeita(preparar({consultarSolicitacao:async()=>({...pedido,status})}).preparar(entrada),'ORCAMENTO_NAO_ACEITO',409);
  }
});
test('valores inconsistentes no banco não são corrigidos silenciosamente',async()=>{
  for(const valor_centavos of [null,NaN,99,100.5,100000001]) {
    await rejeita(preparar({consultarSolicitacao:async()=>({...pedido,valor_centavos})}).preparar(entrada),'ORCAMENTO_INVALIDO',409);
  }
});
test('indisponibilidade da consulta não usa valor antigo nem revela erro interno',async()=>{
  const servico=preparar({consultarSolicitacao:async()=>{throw new Error('segredo de teste');}});
  await assert.rejects(servico.preparar(entrada),e=>e.codigo==='CONSULTA_INDISPONIVEL'&&e.status===503&&!e.message.includes('segredo'));
});
test('produção e métodos não configurados continuam bloqueados',async()=>{
  assert.throws(()=>preparar({ambiente:'producao'}),/somente em testes/);
  for(const body of [{solicitacaoId:id,forma:'pix'},{...entrada.body,parcelas:11},{...entrada.body,parcelas:1}])await rejeita(preparar().preparar({...entrada,body}),'FORMA_NAO_CONFIGURADA',422);
  assert.equal(typeof preparar().cobrar,'undefined');
});

test('registro recebe identidade validada e versão salva, sem valores enviados pelo navegador',async()=>{
  let parametros;
  const preparacaoId='55555555-5555-4555-8555-555555555555';
  const servico=preparar({registrarPreparacao:async dados=>{parametros=dados;return {id:preparacaoId};}});
  const resultado=await servico.preparar(entrada);
  assert.deepEqual(parametros,{solicitacaoId:id,clienteUsuarioId:cliente,versaoOrcamento:pedido.atualizado_em,forma:'credito_parcelado',parcelas:10});
  assert.equal(resultado.preparacaoId,preparacaoId);
  assert.equal(resultado.preparacaoRegistrada,true);
  assert.equal(resultado.pagamentoHabilitado,false);
  assert.ok(resultado.pendencias.includes('PERSISTENCIA_IDEMPOTENTE'), 'tentativas financeiras ainda não foram implementadas');
});
test('resposta incerta do registro não é repetida automaticamente nem tratada como sucesso',async()=>{
  let chamadas=0;
  const servico=preparar({registrarPreparacao:async()=>{chamadas++;throw new Error('detalhes privados');}});
  await rejeita(servico.preparar(entrada),'REGISTRO_INDISPONIVEL',503);
  assert.equal(chamadas,1);
  await rejeita(preparar({registrarPreparacao:async()=>({})}).preparar(entrada),'REGISTRO_INDISPONIVEL',503);
});
test('bloqueios anteriores impedem gravação e o modo padrão continua somente leitura',async()=>{
  let chamadas=0;
  const servico=preparar({registrarPreparacao:async()=>{chamadas++;}});
  await rejeita(servico.preparar({...entrada,body:{...entrada.body,valor_centavos:1}}),'PEDIDO_INVALIDO',400);
  assert.equal(chamadas,0);
  assert.equal((await preparar().preparar(entrada)).preparacaoRegistrada,false);
  assert.throws(()=>preparar({registrarPreparacao:true}),/Registro de preparação inválido/);
});
test('conflito de versão ou condições pede atualização e pedido indisponível não revela detalhes',async()=>{
  for(const [code,codigo,status] of [['22023','PREPARACAO_DIVERGENTE',409],['P0002','SOLICITACAO_INDISPONIVEL',404]]) {
    const servico=preparar({registrarPreparacao:async()=>{throw Object.assign(new Error('detalhes internos'),{code});}});
    await rejeita(servico.preparar(entrada),codigo,status);
  }
});
