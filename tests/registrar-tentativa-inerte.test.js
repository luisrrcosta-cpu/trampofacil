import test from 'node:test';
import assert from 'node:assert/strict';
import {criarRegistradorTentativaInerte} from '../server/registrar-tentativa-inerte.js';

const preparacaoId='11111111-1111-4111-8111-111111111111';
const chaveIdempotencia='22222222-2222-4222-8222-222222222222';
const tentativaId='33333333-3333-4333-8333-333333333333';

test('somente ambiente de teste com transação',()=>{
  assert.throws(()=>criarRegistradorTentativaInerte({ambiente:'producao',banco:{begin(){}}}));
  assert.throws(()=>criarRegistradorTentativaInerte({ambiente:'teste',banco:{}}));
});

test('identificadores inválidos não acessam o banco',async()=>{
  let chamadas=0;
  const registrador=criarRegistradorTentativaInerte({ambiente:'teste',banco:{begin(){chamadas++;}}});
  await assert.rejects(registrador.registrar({preparacaoId:'../../',chaveIdempotencia}));
  await assert.rejects(registrador.registrar({preparacaoId,chaveIdempotencia:'chave livre'}));
  assert.equal(chamadas,0);
});

test('registro usa transação, papel de serviço e SQL parametrizado',async()=>{
  let consultas=0;
  const tx=(strings,...valores)=>{
    consultas++;
    if(consultas===1){assert.match(strings[0],/set local role service_role/);return Promise.resolve([]);}
    assert.match(strings.join('?'),/private\.registrar_tentativa_inerte/);
    assert.deepEqual(valores,[preparacaoId,chaveIdempotencia]);
    return Promise.resolve([{id:tentativaId}]);
  };
  const banco={begin:fn=>fn(tx)};
  const resultado=await criarRegistradorTentativaInerte({ambiente:'teste',banco}).registrar({preparacaoId,chaveIdempotencia});
  assert.deepEqual(resultado,{tentativaId,pagamentoHabilitado:false,repasseHabilitado:false});
  assert.equal(consultas,2);
});

test('erro ou resposta incerta não provoca repetição automática',async()=>{
  let chamadas=0;
  const banco={begin:async fn=>{chamadas++;return fn(()=>{throw new Error('segredo privado');});}};
  await assert.rejects(criarRegistradorTentativaInerte({ambiente:'teste',banco}).registrar({preparacaoId,chaveIdempotencia}),
    e=>e.message==='Não foi possível confirmar a tentativa de teste.');
  assert.equal(chamadas,1);
});

test('duas chamadas paralelas com a mesma chave retornam a mesma tentativa simulada',async()=>{
  let registros=0;
  let fila=Promise.resolve();
  const banco={
    begin:fn=>{
      const tarefa=fila.then(async()=>{
        const tx=(strings,...valores)=>{
          if(strings[0].includes('set local role')) return Promise.resolve([]);
          assert.deepEqual(valores,[preparacaoId,chaveIdempotencia]);
          if(registros===0) registros++;
          return Promise.resolve([{id:tentativaId}]);
        };
        return fn(tx);
      });
      fila=tarefa.then(()=>undefined,()=>undefined);
      return tarefa;
    },
  };
  const registrador=criarRegistradorTentativaInerte({ambiente:'teste',banco});
  const [a,b]=await Promise.all([
    registrador.registrar({preparacaoId,chaveIdempotencia}),
    registrador.registrar({preparacaoId,chaveIdempotencia}),
  ]);
  assert.equal(a.tentativaId,b.tentativaId);
  assert.equal(registros,1);
});
