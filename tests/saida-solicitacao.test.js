import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createContext, runInContext} from 'node:vm';
import test from 'node:test';

const fonte = await readFile(new URL('../cadastro.js', import.meta.url), 'utf8');
const inicio = fonte.indexOf("for (const botao of document.querySelectorAll('[data-pagina]'))");
const fim = fonte.indexOf("document.querySelector('#voltar-cadastro')", inicio);
assert.ok(inicio >= 0 && fim > inicio);
function tela({aceitar = false, ocupado = false, titulo = '', descricao = '', modelo = ''} = {}) {
  let handler, destino, confirmacoes = 0, contagens = 0;
  const campos = [
    {tagName:'INPUT', value:titulo, defaultValue:''},
    {tagName:'TEXTAREA', value:descricao, defaultValue:''},
    {tagName:'SELECT', selectedIndex:modelo ? 1 : 0, options:[{defaultSelected:true},{defaultSelected:false}]},
  ];
  const aviso = {textContent:'Envio não confirmado'};
  const form = {id:'form-solicitacao',
    querySelectorAll:() => campos,
    querySelector:() => null,
    reset() {campos[0].value=''; campos[1].value=''; campos[2].selectedIndex=0;}
  };
  const secao = {querySelector:seletor => seletor.includes('#form-solicitacao') ? form : null};
  const botao = {dataset:{pagina:'catalogo'},closest:() => secao,addEventListener:(_,fn) => {handler=fn;}};
  const ctx = createContext({
    document:{querySelectorAll:() => [botao]},
    window:{confirm(mensagem) {confirmacoes++; assert.match(mensagem,/título e a descrição/);return aceitar;}},
    ocupado, tentativa:{id:'tentativa-preservada'},
    atualizarContadorDescricaoPedido() {contagens++;},
    atualizarContadorPerfilProfissional() {},
    elemento:() => aviso,
    mostrar(id) {destino=id;},
  });
  runInContext(fonte.slice(inicio,fim),ctx);
  return {clicar:() => handler(),campos,aviso,
    estado:() => ({destino,confirmacoes,contagens,tentativa:ctx.tentativa})};
}

test('cancelar saída conserva pedido preenchido, modelo e tentativa incerta', () => {
  const ui=tela({titulo:'Pintura',descricao:'Pintar sala',modelo:'reparo'});
  ui.clicar();
  assert.equal(ui.estado().confirmacoes,1);
  assert.equal(ui.estado().destino,undefined);
  assert.equal(ui.campos[0].value,'Pintura');
  assert.equal(ui.campos[1].value,'Pintar sala');
  assert.equal(ui.campos[2].selectedIndex,1);
  assert.equal(ui.estado().tentativa.id,'tentativa-preservada');
  assert.equal(ui.aviso.textContent,'Envio não confirmado');
});

test('confirmar descarte limpa pedido, contador, aviso e tentativa antes de voltar', () => {
  const ui=tela({aceitar:true,titulo:'Pintura',descricao:'Pintar sala',modelo:'reparo'});
  ui.clicar();
  assert.equal(ui.estado().destino,'catalogo');
  assert.equal(ui.estado().confirmacoes,1);
  assert.equal(ui.campos[0].value,'');
  assert.equal(ui.campos[1].value,'');
  assert.equal(ui.campos[2].selectedIndex,0);
  assert.equal(ui.estado().contagens,1);
  assert.equal(ui.estado().tentativa,undefined);
  assert.equal(ui.aviso.textContent,'');
});

test('pedido vazio volta sem confirmação e alteração apenas do modelo pede confirmação', () => {
  const vazia=tela(); vazia.clicar();
  assert.equal(vazia.estado().destino,'catalogo');
  assert.equal(vazia.estado().confirmacoes,0);
  const modelo=tela({modelo:'reparo'}); modelo.clicar();
  assert.equal(modelo.estado().confirmacoes,1);
  assert.equal(modelo.estado().destino,undefined);
});

test('saída durante operação pendente não descarta nem navega', () => {
  const ui=tela({ocupado:true,aceitar:true,titulo:'Pintura'});
  ui.clicar();
  assert.equal(ui.estado().confirmacoes,0);
  assert.equal(ui.estado().destino,undefined);
  assert.equal(ui.campos[0].value,'Pintura');
  assert.equal(ui.estado().tentativa.id,'tentativa-preservada');
});
