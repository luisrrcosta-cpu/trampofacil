import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createContext,runInContext} from 'node:vm';
import test from 'node:test';
const fonte=await readFile(new URL('../servicos.js',import.meta.url),'utf8');
const inicio=fonte.indexOf('function ordenarPedidos()');
const fim=fonte.indexOf('function aplicarFiltroPedidos()',inicio);

test('ordenação preserva cards, rascunhos e filtros ao priorizar ações e restaurar sequência',()=>{
  const cards=Array.from({length:4},(_,i)=>({id:i,dataset:{ordemCarregamento:String(i),minhaAcao:i===1||i===3?'sim':'nao'},hidden:i===2,rascunho:'valor '+i}));
  const lista={children:[...cards],append(...novos){this.children=novos;}};
  const ctx=createContext({listaPedidos:lista,ordemPedidos:{value:'minha_acao'}});
  runInContext(fonte.slice(inicio,fim),ctx);
  const ordenar=()=>runInContext('ordenarPedidos()',ctx);
  ordenar();assert.deepEqual(lista.children.map(c=>c.id),[1,3,0,2]);
  ctx.ordemPedidos.value='antigas';ordenar();
  assert.deepEqual(lista.children.map(c=>c.id),[3,2,1,0]);
  ctx.ordemPedidos.value='recentes';ordenar();
  assert.deepEqual(lista.children.map(c=>c.id),[0,1,2,3]);
  assert.equal(lista.children[1],cards[1]);assert.equal(cards[1].rascunho,'valor 1');assert.equal(cards[2].hidden,true);
  const anterior=lista.children;ordenar();assert.equal(lista.children,anterior,'não move DOM quando a ordem já está correta');
  lista.children.push({id:4,dataset:{ordemCarregamento:'4',minhaAcao:'sim'}});
  ctx.ordemPedidos.value='minha_acao';ordenar();
  assert.deepEqual(lista.children.map(c=>c.id),[1,3,4,0,2]);
});
