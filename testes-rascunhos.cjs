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
    replaceChildren() {}, eventos: {}, addEventListener(nome, handler) { this.eventos[nome] = handler; },
  });
  return elementos.get(id);
}
const contexto = vm.createContext({
  elemento, texto: (tag, conteudo) => ({ tag, textContent: conteudo }),
  document: { createElement: () => ({ append() {} }) },
  Intl, Date, console,
  nomesStatus: {}, moeda: { format: v => String(v) },
  sessaoServicos: undefined,
  integrado: false, ocupado: false, proteger() {}, retornarParaSolicitacoes() {},
});
formulario.addEventListener = () => {};
formulario.querySelector = () => ({ disabled: false });
vm.runInContext(codigo, contexto, { filename: 'conversa.js' });
const rodar = (js) => vm.runInContext(js, contexto);

rodar("sessaoServicos = {usuario: 'conta-a'}; pedidoEmConversa = '123e4567-e89b-42d3-a456-426614174001';");
memoria.texto.value = 'Rascunho privado';
rodar("trocarSessaoConversa(undefined, 'conta-a')");
assert.equal(memoria.texto.value, '', 'Rascunho não pode permanecer na tela após sair.');
assert.equal(rodar('pedidoEmConversa'), undefined, 'Conversa anterior deve ser fechada.');
rodar("sessaoServicos = {usuario: 'conta-b'}; trocarSessaoConversa(sessaoServicos);");
assert.equal(memoria.texto.value, '', 'Outra conta não pode ver rascunho.');
rodar("sessaoServicos = {usuario: 'conta-a'}; trocarSessaoConversa(sessaoServicos);");
assert.equal(rodar('rascunhoConversa?.pedido'), '123e4567-e89b-42d3-a456-426614174001');
rodar("abrirConversa('123e4567-e89b-42d3-a456-426614174001')");
assert.equal(memoria.texto.value, 'Rascunho privado', 'Rascunho deve voltar somente ao abrir a conversa original.');
rodar("trocarSessaoConversa(undefined, 'conta-a')");
rodar("sessaoServicos = {usuario: 'conta-b'}; trocarSessaoConversa(sessaoServicos);");
rodar("abrirConversa('123e4567-e89b-42d3-a456-426614174001')");
assert.equal(memoria.texto.value, '', 'Outra conta não pode recuperar texto da conta anterior.');
rodar("sessaoServicos = {usuario: 'conta-a'}; trocarSessaoConversa(sessaoServicos);");
rodar("abrirConversa('123e4567-e89b-42d3-a456-426614174002')");
assert.equal(memoria.texto.value, '', 'Rascunho não pode ser exibido em outro pedido.');
console.log('Isolamento de rascunhos entre contas aprovado.');

// Voltar à lista limpa a tela, mas preserva o texto e a incerteza do envio.
rodar("sessaoServicos = {usuario:'conta-a'}; abrirConversa('123e4567-e89b-42d3-a456-426614174001'); envioIncerto = true;");
memoria.texto.value = 'Mensagem ainda não confirmada';
elemento('voltar-solicitacoes').eventos.click();
assert.equal(memoria.texto.value, '');
assert.equal(rodar('pedidoEmConversa'), undefined);
rodar("abrirConversa('123e4567-e89b-42d3-a456-426614174001')");
assert.equal(memoria.texto.value, 'Mensagem ainda não confirmada');
assert.equal(rodar('envioIncerto'), true, 'Voltar não pode liberar o reenvio de resultado incerto.');
elemento('voltar-solicitacoes').eventos.click();
rodar("sessaoServicos = {usuario:'conta-b'}; abrirConversa('123e4567-e89b-42d3-a456-426614174001')");
assert.equal(memoria.texto.value, '', 'Rascunho da navegação não pode aparecer em outra conta.');
assert.equal(rodar('envioIncerto'), false);
console.log('Navegação preserva rascunho e resultado incerto apenas para a conta original.');
