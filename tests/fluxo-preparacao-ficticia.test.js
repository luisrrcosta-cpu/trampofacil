import test from 'node:test';
import assert from 'node:assert/strict';
import {criarPreparadorPagamento} from '../server/preparar-pagamento.js';
const cliente='00000000-0000-4000-8000-000000000001';
const profissional='00000000-0000-4000-8000-000000000002';
const solicitacao='00000000-0000-4000-8000-000000000003';
const preparacao='00000000-0000-4000-8000-000000000004';
const versao='2026-11-22T12:00:00.000Z';
const pedido={id:solicitacao,cliente_usuario_id:cliente,profissional_usuario_id:profissional,status:'aceita',valor_centavos:105,atualizado_em:versao};
const entrada={authorization:'Bearer token-ficticio',body:{solicitacaoId:solicitacao,forma:'credito_avista',parcelas:1}};
const montar=({alteracoes={},registrarPreparacao}={})=>criarPreparadorPagamento({ambiente:'teste',autenticar:async()=>({id:cliente,isAnonymous:false}),consultarSolicitacao:async()=>({...pedido,...alteracoes}),registrarPreparacao});
test('contratação fictícia aceita: prepara sem cobrar e arredonda centavos',async()=>{
 let chamadas=0;
 const resultado=await montar({registrarPreparacao:async dados=>{chamadas++;assert.deepEqual(dados,{solicitacaoId:solicitacao,clienteUsuarioId:cliente,versaoOrcamento:versao,forma:'credito_avista',parcelas:1});return {id:preparacao};}}).preparar(entrada);
 assert.equal(chamadas,1);assert.equal(resultado.preparacaoId,preparacao);assert.equal(resultado.valorServicoCentavos,105);assert.equal(resultado.comissaoCentavos,11);assert.equal(resultado.profissionalCentavos,94);assert.equal(resultado.pagamentoHabilitado,false);assert.equal(resultado.preparacaoRegistrada,true);
});
for(const [nome,alteracoes,codigo] of [
 ['contratação concluída',{status:'concluida'},'ORCAMENTO_NAO_ACEITO'],
 ['contratação cancelada',{status:'cancelada'},'ORCAMENTO_NAO_ACEITO'],
 ['outro cliente',{cliente_usuario_id:profissional},'SOLICITACAO_INDISPONIVEL'],
 ['profissional igual ao cliente',{profissional_usuario_id:cliente},'ORCAMENTO_INVALIDO'],
 ['valor abaixo do mínimo',{valor_centavos:99},'ORCAMENTO_INVALIDO'],
])test(`${nome}: não registra preparação`,async()=>{
 let chamadas=0;const servico=montar({alteracoes,registrarPreparacao:async()=>{chamadas++;return {id:preparacao};}});
 await assert.rejects(servico.preparar(entrada),erro=>erro.codigo===codigo);assert.equal(chamadas,0);
});
