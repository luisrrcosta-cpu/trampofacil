import assert from 'node:assert/strict';
import {urlHomologacao,nomeFuncaoPreparacao} from '../server/edge-homologacao.js';

// Somente chamadas sem sessão válida. Não cria conta, preparação ou cobrança.
const endpoint=`${urlHomologacao}/functions/v1/${nomeFuncaoPreparacao}`;
const headers={'Content-Type':'application/json',apikey:'sb_publishable_LqyoPHGK1jifRxab6vPgYg_H26zanvz'};
async function conferir(rotulo,opcoes,status,codigo) {
  const resposta=await fetch(endpoint,{
    ...opcoes,headers:{...headers,...opcoes.headers},redirect:'error',cache:'no-store',
    credentials:'omit',signal:AbortSignal.timeout(20000),
  });
  assert.equal(resposta.status,status,rotulo);
  if(codigo)assert.equal((await resposta.json()).erro,codigo,rotulo);
  assert.equal(resposta.headers.get('Cache-Control'),'no-store');
  console.log(`OK: ${rotulo} (${status}).`);
}
await conferir('sem sessão não prepara pagamento',{method:'POST',body:'{}'},401,'NAO_AUTENTICADO');
await conferir('token inválido é recusado',{method:'POST',headers:{Authorization:'Bearer token-ficticio'},body:'{}'},401,'NAO_AUTENTICADO');
await conferir('origem externa é recusada',{method:'POST',headers:{Origin:'https://externo.example.invalid'},body:'{}'},403,'ORIGEM_NAO_PERMITIDA');
await conferir('GET não grava dados',{method:'GET'},405,'METODO_NAO_PERMITIDO');
await conferir('corpo excessivo é recusado',{method:'POST',body:'x'.repeat(4097)},413,'CORPO_MUITO_GRANDE');
await conferir('preflight da própria API não exige sessão',{method:'OPTIONS',headers:{Origin:urlHomologacao}},204);
console.log('Serviço de testes respondeu. Nenhum teste autenticado foi executado.');
