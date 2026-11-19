'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const codigo = fs.readFileSync('conversa.js', 'utf8');
const memoria = { texto: { value: '', addEventListener() {} } };
const formulario = { elements: memoria, reset() { memoria.texto.value = ''; }, hidden: false };
const elementos = new Map();
function elemento(id) {
  if (id === 'form-mensagem') return formulario;
  if (!elementos.has(id)) elementos.set(id, {
    textContent: '', hidden: false, disabled: false, value: '',
    replaceChildren() {}, addEventListener() {},
  });
  return elementos.get(id);
}
const contexto = vm.createContext({
  elemento, texto: (tag, conteudo) => ({ tag, textContent: conteudo }),
  document: { createElement: () => ({ append() {} }) },
  Intl, Date, console,
  nomesStatus: {}, moeda: { format: v => String(v) },
  sessaoServicos: undefined,
  integrado: false,
});
formulario.addEventListener = () => {};
formulario.querySelector = () => ({ disabled: false });
vm.runInContext(codigo, contexto, { filename: 'conversa.js' });
const rodar = (js) => vm.runInContext(js, contexto);

rodar("sessaoServicos = {usuario: 'conta-a'}; pedidoEmConversa = 'pedido-1';");
memoria.texto.value = 'Rascunho privado';
rodar("trocarSessaoConversa(undefined, 'conta-a')");
assert.equal(memoria.texto.value, '', 'Rascunho não pode permanecer na tela após sair.');
assert.equal(rodar('pedidoEmConversa'), undefined, 'Conversa anterior deve ser fechada.');
rodar("sessaoServicos = {usuario: 'conta-b'}; trocarSessaoConversa(sessaoServicos);");
assert.equal(memoria.texto.value, '', 'Outra conta não pode ver rascunho.');
rodar("sessaoServicos = {usuario: 'conta-a'}; trocarSessaoConversa(sessaoServicos);");
assert.equal(rodar('rascunhoConversa?.pedido'), 'pedido-1');
console.log('Isolamento de rascunhos entre contas aprovado.');
