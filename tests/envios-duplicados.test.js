import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createContext, runInContext} from 'node:vm';
import test from 'node:test';

// Exercita os handlers reais enquanto a primeira resposta permanece pendente.
// Eventos podem se repetir antes de o navegador aplicar o estado desabilitado.
async function interfaceTeste(arquivo) {
  const elementos = new Map();
  function elemento(id) {
    if (!elementos.has(id)) elementos.set(id, {
      value: id === 'tipo-perfil' ? 'cliente' : '',
      elements: Object.fromEntries(['forma','parcelas','nome','email','telefone','cidade','servico','descricao']
        .map(c => [c, {addEventListener() {}, value:c === 'forma' ? 'credito_avista' : c === 'parcelas' ? '1' : ''}])),
      eventos:{}, addEventListener(nome, handler) {this.eventos[nome] = handler;},
      reset() {}, replaceChildren() {}, querySelector() {return {};}
    });
    return elementos.get(id);
  }
  let chamadas = 0;
  let concluir;
  const pendente = new Promise(resolve => {concluir = resolve;});
  const contexto = createContext({elemento, URLSearchParams, ocupado:false,
    sessaoServicos:{usuario:'cliente'}, tabelas:{cliente:'clientes'},
    controleSessao:{requisitar:() => {chamadas++; return pendente;}},
    bloquear() {}, mostrar() {}, proteger() {}, exigirNovoLogin() {},
    lerPerfil:() => ({perfil:{nome:'Luis'}}), moeda:new Intl.NumberFormat('pt-BR'),
  });
  runInContext(await readFile(new URL('../' + arquivo, import.meta.url),'utf8'), contexto);
  return {contexto, elemento, chamadas:() => chamadas,
    concluir:() => concluir({ok:false,status:503}),
    executar:codigo => runInContext(codigo, contexto)};
}
const evento = {preventDefault() {}};

test('cadastro ignora leituras duplicadas enquanto aguarda a primeira resposta', async () => {
  const ui = await interfaceTeste('perfil.js');
  const primeira = ui.executar('carregarPerfil()');
  await ui.executar('carregarPerfil()');
  assert.equal(ui.chamadas(), 1);
  ui.concluir(); await primeira;
  await ui.executar('carregarPerfil()');
  assert.equal(ui.chamadas(), 2, 'permite atualizar após o erro');
});

test('salvar cadastro impede PATCH duplicado e atualização concorrente', async () => {
  const ui = await interfaceTeste('perfil.js');
  ui.executar("perfilEmTela = {usuario:'cliente',tipo:'cliente'}");
  const salvar = ui.elemento('form-perfil').eventos.submit;
  const primeira = salvar(evento);
  await salvar(evento);
  await ui.executar('carregarPerfil()');
  assert.equal(ui.chamadas(), 1);
  ui.concluir(); await primeira;
  await salvar(evento);
  assert.equal(ui.chamadas(), 2);
});

test('preparação ignora duplo envio e reabertura durante resposta pendente', async () => {
  const ui = await interfaceTeste('pagamentos.js');
  const pedido = "{id:'pedido',cliente_usuario_id:'cliente',status:'aceita',valor_centavos:10000,atualizado_em:'v1'}";
  ui.executar(`abrirPreparacao(${pedido})`);
  const enviar = ui.elemento('form-preparacao').eventos.submit;
  const primeira = enviar(evento);
  await enviar(evento);
  ui.executar(`abrirPreparacao(${pedido})`);
  await enviar(evento);
  assert.equal(ui.chamadas(), 1);
  ui.concluir(); await primeira;
  await enviar(evento);
  assert.equal(ui.chamadas(), 2, 'resultado incerto permite conferência explícita');
});
