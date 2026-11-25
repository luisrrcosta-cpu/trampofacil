import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import { chromium } from 'playwright-core';

test('busca, autenticação e solicitação com repetição segura', async (t) => {
  let autenticacaoProntaTeste = true;
  const server = createServer(async (req, res) => {
    const arquivos = ['index.html', 'config.js', 'ambiente.js', 'cadastro.js', 'valores.js', 'simulacao.js', 'simulador.js', 'sessao.js', 'servicos.js', 'avaliacoes.js', 'conversa.js', 'transicoes-contratacao.js', 'pagamentos.js', 'perfil.js'];
    const arquivo = req.url === '/' ? 'index.html' : req.url.slice(1);
    if (!arquivos.includes(arquivo)) {
      res.writeHead(404).end();
      return;
    }
    if (arquivo === 'config.js') {
      res.setHeader('Content-Type', 'application/javascript');
      res.end(`window.TRAMPOFACIL_SUPABASE = {ambiente:'homologacao',url:'https://asdszqtpydiowgerxwee.supabase.co',chavePublicavel:'sb_publishable_teste',autenticacaoPronta:${autenticacaoProntaTeste}};`);
      return;
    }
    res.setHeader('Content-Type', arquivo.endsWith('.js') ? 'application/javascript' : 'text/html; charset=utf-8');
    res.end(await readFile(new URL('../' + arquivo, import.meta.url)));
  }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const browser = await chromium.launch({
    executablePath: process.env.TRAMPOFACIL_CHROMIUM || '/usr/bin/chromium',
  });
  t.after(() => browser.close());
  const page = await browser.newPage();
  page.setDefaultTimeout(4000);
  page.on('dialog', dialog => dialog.accept());
  const erros = [];
  page.on('pageerror', (error) => erros.push(error.message));
  const profissional = {
    id: '77777777-7777-4777-8777-777777777777', nome: '<img src=x onerror=alert(1)>',
    cidade: 'São Paulo', servico: 'Pintura', descricao: 'Paredes internas',
  };
  let pedido;
  let falhaCheckout;
  let chamadasCheckout = 0;
  let falharAtualizacao = true;
  const criacoes = [];
  const data = '2026-11-18T12:00:00+00:00';
  const chats = Array.from({ length: 31 }, (_, i) => ({
    id: `00000000-0000-4000-8000-${String(31 - i).padStart(12, '0')}`, criado_em: data, autor_usuario_id: '22222222-2222-4222-8222-222222222222', texto: `Mensagem fictícia ${31 - i}`,
  }));
  let rejeitarMensagem = false;
  let pedidosPaginados;
  let falharPaginaPedidos = true;
  let expirarSessao = false;
  let perderResposta = false;
  let tentativasMensagem = 0;
  let chamadasApi = 0;
  const preparacoes = [];
  let respostaPreparacaoIncerta = true;
  let aguardarPreparacao = false;
  let liberarPreparacao;
  let avisarPreparacaoIniciada;
  const perfis = {clientes:{usuario_id:'11111111-1111-4111-8111-111111111111',nome:'Pessoa fictícia',email:'cliente@example.com',telefone:'11999999999',cidade:'São Paulo'},profissionais:{usuario_id:'22222222-2222-4222-8222-222222222222',nome:'Pessoa profissional',telefone:'11999999999',cidade:'São Paulo',servico:'Pintura',descricao:'Serviço de teste',publicado:false,pausado:false}};
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**', async (route) => {
    chamadasApi++;
    const req = route.request();
    const url = new URL(req.url());
    if (url.pathname === '/functions/v1/consultar-tentativa-checkout-sandbox') {
      assert.deepEqual(req.postDataJSON(), {preparacaoId:'55555555-5555-4555-8555-555555555555'});
      assert.equal(req.headers().authorization, 'Bearer cliente');
      return route.fulfill({json:{preparacaoId:'55555555-5555-4555-8555-555555555555',estado:'incerto',ambiente:'sandbox',pagamentoConfirmado:false,liberarRepasse:false}});
    }
    if (url.pathname === '/functions/v1/criar-checkout-sandbox') {
      chamadasCheckout++;
      if (falhaCheckout === 'rede') return route.abort('failed');
      if (falhaCheckout === 'http') return route.fulfill({status:503,json:{erro:'CHECKOUT_NAO_CONFIRMADO'}});
      if (falhaCheckout === 'resposta') return route.fulfill({json:{url:'https://externo.invalid'}});
      assert.deepEqual(req.postDataJSON(), {preparacaoId:'55555555-5555-4555-8555-555555555555'});
      assert.equal(req.headers().authorization, 'Bearer cliente');
      return route.fulfill({json:{ambiente:'sandbox',pagamentoRealHabilitado:false,repasseHabilitado:false,
        checkoutId:'CHEC_ficticio',url:'https://qa.pagamento.pagseguro.uol.com.br/pagamento?code=ficticio'}});
    }
    if (url.pathname === '/functions/v1/preparar-pagamento-teste') {
      const dados = req.postDataJSON();
      assert.deepEqual(Object.keys(dados).sort(), ['forma','parcelas','solicitacaoId']);
      assert.equal(req.headers().authorization, 'Bearer cliente');
      preparacoes.push(dados);
      if (respostaPreparacaoIncerta) {respostaPreparacaoIncerta = false; return route.abort('failed');}
      if (aguardarPreparacao) await new Promise(resolve => {liberarPreparacao = resolve; avisarPreparacaoIniciada?.();});
      return route.fulfill({json:{solicitacaoId:pedido.id,versaoOrcamento:pedido.atualizado_em,
        valorServicoCentavos:pedido.valor_centavos,comissaoCentavos:1500,profissionalCentavos:13500,
        ...dados,preparacaoId:'55555555-5555-4555-8555-555555555555',preparacaoRegistrada:true,pagamentoHabilitado:false}});
    }
    if (url.pathname.endsWith('/buscar_profissionais')) {
      assert.equal(req.headers().authorization, undefined);
      assert.deepEqual(req.postDataJSON(), { termo_servico: 'Pintura %', termo_cidade: 'São Paulo', pagina: 0 });
      return route.fulfill({ json: [profissional] });
    }
    if (url.pathname.endsWith('/otp')) {
      assert.equal(req.postDataJSON().create_user, false);
      return route.fulfill({ json: {} });
    }
    if (url.pathname.endsWith('/verify')) {
      const { email, token } = req.postDataJSON();
      if (!['123456','12345678'].includes(token)) return route.fulfill({ status: 400 });
      const id = email.startsWith('cliente') ? 'cliente' : 'profissional';
      return route.fulfill({ json: { access_token: id, user: { id: id === 'cliente' ? '11111111-1111-4111-8111-111111111111' : '22222222-2222-4222-8222-222222222222' } } });
    }
    assert.match(req.headers().authorization, /^Bearer (cliente|profissional)$/);
    if (url.pathname.endsWith('/clientes') || url.pathname.endsWith('/profissionais')) {
      const tipo = url.pathname.split('/').at(-1);
      const usuario = req.headers().authorization.split(' ').at(-1);
      assert.equal(url.searchParams.get('usuario_id'),'eq.'+(usuario === 'cliente' ? '11111111-1111-4111-8111-111111111111' : '22222222-2222-4222-8222-222222222222'));
      const perfil = perfis[tipo];
      if (req.method() === 'PATCH') {
        const dados = req.postDataJSON();
        assert.ok(!('usuario_id' in dados)); assert.ok(!('publicado' in dados));
        assert.equal(perfil.usuario_id, usuario === 'cliente' ? '11111111-1111-4111-8111-111111111111' : '22222222-2222-4222-8222-222222222222');
        Object.assign(perfil,dados);
        return route.fulfill({json:[{usuario_id:perfil.usuario_id,...(tipo==='profissionais'?{publicado:perfil.publicado,pausado:perfil.pausado}:{})}]});
      }
      return route.fulfill({json:perfil.usuario_id===(usuario === 'cliente' ? '11111111-1111-4111-8111-111111111111' : '22222222-2222-4222-8222-222222222222')?[perfil]:[]});
    }
    if (url.pathname.endsWith('/historico_solicitacoes')) {
      assert.equal(url.searchParams.get('select'), 'id,criado_em,status,valor_centavos');
      assert.equal(url.searchParams.get('solicitacao_id'), 'eq.' + pedido.id);
      return route.fulfill({ json: [{ id: '00000000-0000-4000-8000-000000000090', criado_em: data, status: 'solicitada', valor_centavos: null }] });
    }
    if (url.pathname.endsWith('/mensagens_solicitacoes')) {
      if (req.method() === 'POST') {
        const dados = req.postDataJSON();
        assert.deepEqual(Object.keys(dados).sort(), ['solicitacao_id', 'texto']);
        assert.equal(dados.solicitacao_id, pedido.id);
        tentativasMensagem++;
        if (expirarSessao) {
          expirarSessao = false;
          return route.fulfill({ status: 401 });
        }
        if (rejeitarMensagem) {
          pedido.status = 'cancelada';
          return route.fulfill({ status: 403 });
        }
        chats.unshift({ id: `00000000-0000-4000-8000-${String(32 + tentativasMensagem - 1).padStart(12, '0')}`, criado_em: data, texto: dados.texto,
          autor_usuario_id: req.headers().authorization.endsWith('cliente') ? '11111111-1111-4111-8111-111111111111' : '22222222-2222-4222-8222-222222222222' });
        if (perderResposta) {
          perderResposta = false;
          return route.abort('failed');
        }
        return route.fulfill({ status: 201 });
      }
      assert.equal(url.searchParams.get('select'), 'id,criado_em,autor_usuario_id,texto');
      assert.equal(url.searchParams.get('solicitacao_id'), 'eq.' + pedido.id);
      const anterior = url.searchParams.get('or');
      if (anterior) {
        assert.equal(anterior, `(criado_em.lt.${data},and(criado_em.eq.${data},id.lt.00000000-0000-4000-8000-000000000002))`);
        return route.fulfill({ json: chats.slice(-1) });
      }
      return route.fulfill({ json: chats.slice(0, 31) });
    }
    if (req.method() === 'POST') {
      const dados = req.postDataJSON();
      criacoes.push(dados);
      assert.equal(dados.cliente_usuario_id, '11111111-1111-4111-8111-111111111111');
      assert.equal(dados.profissional_id, '77777777-7777-4777-8777-777777777777');
      if (pedido) return route.fulfill({ status: 409 });
      pedido = { ...dados, profissional_usuario_id:'22222222-2222-4222-8222-222222222222', status: 'solicitada', valor_centavos: null, atualizado_em: '2026-11-18T00:00:00+00:00' };
      return route.abort('failed');
    }
    if (req.method() === 'PATCH') {
      assert.equal(url.searchParams.get('atualizado_em'), 'eq.' + pedido.atualizado_em);
      if (falharAtualizacao) {
        falharAtualizacao = false;
        return route.fulfill({ json: [] });
      }
      Object.assign(pedido, req.postDataJSON());
      return route.fulfill({ json: [{ id: pedido.id }] });
    }
    if (pedidosPaginados && url.searchParams.get('limit') === '51') {
      assert.equal(url.searchParams.get('order'), 'atualizado_em.desc,id.desc');
      if (url.searchParams.has('or')) {
        const { atualizado_em, id } = pedidosPaginados[49];
        assert.equal(url.searchParams.get('or'),
          `(atualizado_em.lt.${atualizado_em},and(atualizado_em.eq.${atualizado_em},id.lt.${id}))`);
        if (falharPaginaPedidos) {
          falharPaginaPedidos = false;
          return route.fulfill({ status: 503 });
        }
        return route.fulfill({ json: pedidosPaginados.slice(50) });
      }
      return route.fulfill({ json: pedidosPaginados.slice(0, 51) });
    }
    return route.fulfill({ json: pedido ? [pedido] : [] });
  });

  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.getByRole('button', { name: 'Simular custos de pagamento' }).click();
  await page.getByLabel('Orçamento do serviço (R$)').fill('100,00');
  await page.getByRole('button', { name: 'Calcular simulação' }).click();
  assert.match(await page.locator('#resultado-simulacao').innerText(), /104,17/);
  await page.locator('#form-simulacao').getByLabel('Forma de pagamento').selectOption('credito_parcelado');
  await page.getByLabel('Quantidade de parcelas').selectOption('10');
  await page.getByRole('button', { name: 'Calcular simulação' }).click();
  assert.match(await page.locator('#resultado-simulacao').innerText(), /113,64/);
  assert.match(await page.locator('#resultado-simulacao').innerText(), /4 ×.*11,37.*6 ×.*11,36/);
  assert.equal(chamadasApi, 0, 'simulação não deve enviar requisições ou criar cobranças');
  await page.locator('#simulacao').getByRole('button', { name: 'Página inicial' }).click();
  await page.getByRole('button', { name: 'Buscar profissionais' }).click();
  await page.locator('#form-busca').getByLabel('Serviço').fill('Pintura %');
  await page.locator('#form-busca').getByLabel('Cidade').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByText(profissional.nome, { exact: true }).waitFor();
  assert.equal(await page.locator('#resultados-busca img').count(), 0);
  await page.getByRole('button', { name: 'Solicitar serviço' }).click();

  async function entrar(email, testarCodigoInvalido = false) {
    await page.locator('#form-entrar').getByLabel('E-mail').fill(email);
    await page.getByRole('button', { name: 'Enviar código' }).click();
    if (testarCodigoInvalido) {
      await page.getByLabel('Código de acesso').fill('000000');
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
      await page.getByText('Código inválido ou expirado.', { exact: false }).waitFor();
    }
    await page.getByLabel('Código de acesso').fill(email.startsWith('cliente') ? '12345678' : '123456');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  }

  await entrar('cliente@example.com', true);
  await page.getByLabel('Título').fill('Pintar sala');
  for (const incompleta of ['Pintar uma parede. Bairro: [informe]', 'Local: [ INFORME ]', 'Detalhes: [descreva]']) {
    await page.locator('#form-solicitacao').getByLabel('Descrição').fill(incompleta);
    await page.getByRole('button', { name: 'Enviar solicitação' }).click();
    await page.getByText('Complete os campos entre colchetes do modelo antes de enviar.', { exact: true }).waitFor();
    assert.equal(criacoes.length, 0, 'modelo incompleto não pode criar solicitação');
  }
  await page.locator('#form-solicitacao').getByLabel('Descrição').fill('Pintar uma parede.');
  await page.getByRole('button', { name: 'Enviar solicitação' }).click();
  await page.getByText('Não foi possível confirmar o envio.', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Enviar solicitação' }).click();
  await page.getByText('Enviada · Solicitada').waitFor();
  assert.equal(criacoes.length, 2);
  assert.equal(criacoes[0].id, criacoes[1].id);
  assert.equal(await page.getByRole('button', { name: 'Enviar proposta' }).count(), 0);
  assert.match(await page.locator('#resumo-solicitacoes').innerText(), /1 solicitações carregadas: 1 em aberto, 0 aguardando sua ação/);
  assert.match(await page.locator('#lista-solicitacoes time').innerText(), /Última atualização:.*horário de Brasília/);
  assert.equal(await page.locator('#lista-solicitacoes time').getAttribute('datetime'), new Date(pedido.atualizado_em).toISOString());
  const chamadasAntesFiltros = chamadasApi;
  const cardsPedidos = page.locator('#lista-solicitacoes article:visible');
  await page.getByLabel('Buscar nas solicitações carregadas',{exact:true}).fill('PÍNTAR');
  assert.equal(await cardsPedidos.count(),1,'busca ignora acento e maiúsculas');
  await page.getByLabel('Buscar nas solicitações carregadas',{exact:true}).fill('parede');
  assert.equal(await cardsPedidos.count(),1,'busca também encontra descrição');
  await page.getByLabel('Tipo de solicitação').selectOption('recebida');
  assert.equal(await cardsPedidos.count(),0,'cliente não vê enviada como recebida');
  await page.getByLabel('Tipo de solicitação').selectOption('enviada');
  await page.getByLabel('Filtrar por situação').selectOption('concluida');
  assert.equal(await cardsPedidos.count(),0,'combina tipo, busca e situação');
  assert.match(await page.locator('#resumo-solicitacoes').innerText(), /1 solicitações carregadas: 1 em aberto/, 'resumo não confunde filtro vazio com ausência de pedidos');
  await page.getByLabel('Filtrar por situação').selectOption('todas');
  await page.getByLabel('Buscar nas solicitações carregadas',{exact:true}).fill('serviço inexistente');
  assert.equal(await cardsPedidos.count(),0);
  await page.locator('#solicitacoes').getByRole('button',{name:'Limpar filtros',exact:true}).click();
  assert.equal(await cardsPedidos.count(),1);
  assert.equal(chamadasApi,chamadasAntesFiltros,'filtros não enviam texto ao servidor');
  // A pesquisa será apagada na próxima troca de conta.
  await page.getByLabel('Buscar nas solicitações carregadas',{exact:true}).fill('sala');


  await page.getByRole('button', { name: 'Ver histórico e mensagens' }).click();
  await page.locator('#historico-conversa').getByText('Solicitada', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Ver mensagens anteriores' }).click();
  await page.getByText('Mensagem fictícia 1', { exact: true }).waitFor();
  const textoFicticio = '<img src=x onerror=alert(1)> Mensagem de teste';
  await page.getByRole('textbox', { name: 'Mensagem', exact: true }).fill(textoFicticio);
  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
  await page.getByText(textoFicticio, { exact: true }).waitFor();
  assert.equal(await page.locator('#mensagens-conversa img').count(), 0);
  assert.equal(await page.locator('#mensagens-conversa li').first().locator('strong').textContent(), 'Você');
  await page.getByRole('button', { name: 'Voltar às solicitações' }).click();
  await page.waitForFunction(() => document.activeElement?.tagName === 'H3');
  assert.equal(await page.locator('#lista-solicitacoes h3').first().evaluate(el=>el===document.activeElement),true,'retorno foca o pedido após atualizar');
  assert.equal(await page.getByLabel('Buscar nas solicitações carregadas',{exact:true}).inputValue(),'sala','pesquisa é mantida no retorno');
  await page.locator('#solicitacoes').getByRole('button', { name: 'Página inicial' }).click();
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await page.getByRole('button', { name: 'Minhas solicitações' }).click();
  await entrar('profissional@example.com');
  await page.getByText('Recebida · Solicitada').waitFor();
  assert.equal(await page.getByLabel('Buscar nas solicitações carregadas',{exact:true}).inputValue(),'');
  assert.equal(await page.getByLabel('Tipo de solicitação').inputValue(),'todas');
  await page.getByLabel('Tipo de solicitação').selectOption('recebida');
  assert.equal(await page.locator('#lista-solicitacoes article:visible').count(),1);
  await page.locator('#solicitacoes').getByRole('button',{name:'Limpar filtros',exact:true}).click();

  await page.locator('#solicitacoes').getByRole('button',{name:'Página inicial',exact:true}).click();
  await page.getByRole('button',{name:'Meu cadastro',exact:true}).click();
  await page.locator('#status-perfil').getByText('Você ainda não tem este cadastro.',{exact:false}).waitFor();
  await page.getByLabel('Tipo de cadastro').selectOption('profissional');
  await page.locator('#form-perfil').waitFor();
  await page.locator('#form-perfil').getByLabel('Serviço oferecido').fill('Pintura e acabamento');
  assert.equal(await page.locator('#form-perfil select[name="tipo_prestador"]').inputValue(), '', 'perfil legado não recebe classificação inventada');
  await page.locator('#form-perfil select[name="tipo_prestador"]').selectOption('pessoa_fisica');
  await page.locator('#form-perfil select[name="tipo_atividade"]').selectOption('ocasional');
  await page.getByRole('button',{name:'Salvar meu cadastro',exact:true}).click();
  await page.locator('#status-perfil').getByText('Seu cadastro foi atualizado.',{exact:true}).waitFor();
  assert.equal(perfis.profissionais.servico,'Pintura e acabamento');
  assert.equal(perfis.profissionais.tipo_prestador,'pessoa_fisica');
  assert.equal(perfis.profissionais.tipo_atividade,'ocasional');
  assert.equal(perfis.profissionais.publicado,false,'editar perfil não publica automaticamente');
  await page.locator('#perfil').getByRole('button',{name:'Página inicial',exact:true}).click();
  await page.getByRole('button',{name:'Minhas solicitações',exact:true}).click();
  await page.getByText('Recebida · Solicitada').waitFor();

  await page.getByLabel('Valor da proposta (R$)').fill('150');
  await page.getByRole('button', { name: 'Enviar proposta' }).click();
  await page.getByText('A solicitação mudou.', { exact: false }).waitFor();
  await page.getByLabel('Valor da proposta (R$)').fill('150');
  await page.getByRole('button', { name: 'Enviar proposta' }).click();
  await page.getByText('Recebida · Proposta enviada').waitFor();
  assert.equal(pedido.valor_centavos, 15000);
  await page.getByRole('button', { name: 'Ver histórico e mensagens' }).click();
  await page.getByText(textoFicticio, { exact: true }).waitFor();
  assert.equal(await page.locator('#mensagens-conversa li').first().locator('strong').textContent(), 'Outra parte');
  await page.getByRole('textbox', { name: 'Mensagem', exact: true }).fill('Resposta fictícia');
  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
  await page.getByText('Resposta fictícia', { exact: true }).waitFor().catch(async erro => { throw new Error(`Mensagem não apareceu: ${await page.locator('#status-mensagem').innerText().catch(()=> 'sem status')} / ${await page.locator('#status-conversa').innerText().catch(()=> 'sem conversa')} / ${JSON.stringify(erros)}`, {cause:erro}); });
  const campoMensagem = page.getByRole('textbox', { name: 'Mensagem', exact: true });
  const botaoMensagem = page.getByRole('button', { name: 'Enviar mensagem' });
  expirarSessao = true;
  await campoMensagem.fill('Rascunho de teste');
  await botaoMensagem.click();
  await page.getByText('Sua sessão expirou.', { exact: false }).waitFor();
  await entrar('profissional@example.com');
  await page.getByRole('button', {name:'Ver histórico e mensagens',exact:true}).click();
  await campoMensagem.waitFor();
  assert.equal(await campoMensagem.inputValue(), 'Rascunho de teste');

  expirarSessao = true;
  await botaoMensagem.click();
  await page.getByText('Sua sessão expirou.', { exact: false }).waitFor();
  await entrar('cliente@example.com');
  await page.getByRole('button', {name:'Ver histórico e mensagens',exact:true}).click();
  await campoMensagem.waitFor();
  assert.equal(await campoMensagem.inputValue(), '');

  perderResposta = true;
  await campoMensagem.fill('Mensagem salva sem resposta');
  await botaoMensagem.click();
  await page.getByText('Não foi possível confirmar o envio.', { exact: false }).waitFor();
  assert.equal(await botaoMensagem.isDisabled(), true);
  const total = tentativasMensagem;
  await page.getByRole('button', { name: 'Atualizar histórico e mensagens' }).click();
  await page.getByText('Mensagem salva sem resposta', { exact: true }).waitFor();
  assert.equal(tentativasMensagem, total);
  assert.equal(await botaoMensagem.isEnabled(), true);
  rejeitarMensagem = true;
  await page.getByRole('textbox', { name: 'Mensagem', exact: true }).fill('Mensagem após cancelamento');
  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
  await page.getByText('Solicitação encerrada.', { exact: false }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Enviar mensagem' }).isVisible(), false);
  await page.getByText('Resposta fictícia', { exact: true }).waitFor();
  assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
  pedidosPaginados = Array.from({ length: 52 }, (_, i) => ({
    ...pedido, titulo: `Solicitação fictícia ${52 - i}`,
    id: '00000000-0000-4000-8000-' + String(52 - i).padStart(12, '0'),
  }));
  await page.getByRole('button', { name: 'Voltar às solicitações' }).click();
  const anteriores = page.getByRole('button', { name: 'Ver solicitações anteriores' });
  await anteriores.waitFor();
  assert.equal(await page.locator('#lista-solicitacoes article').count(), 50);
  await anteriores.click();
  await page.getByText('Não foi possível carregar as solicitações anteriores.', { exact: false }).waitFor();
  assert.equal(await page.locator('#lista-solicitacoes article').count(), 50);
  await anteriores.click();
  await page.getByText('Solicitação fictícia 1', { exact: true }).waitFor();
  assert.equal(await page.locator('#lista-solicitacoes article').count(), 52);
  assert.equal(await anteriores.isVisible(), false);
  await page.locator('#solicitacoes').getByRole('button', { name: 'Atualizar', exact: true }).click();
  await anteriores.waitFor();
  assert.equal(await page.locator('#lista-solicitacoes article').count(), 50);
  await page.locator('#solicitacoes').getByRole('button',{name:'Página inicial',exact:true}).click();
  await page.getByRole('button',{name:'Meu cadastro',exact:true}).click();
  await page.locator('#form-perfil').waitFor();
  assert.equal(await page.locator('#form-perfil input[name="email"]').getAttribute('readonly'),'');
  await page.locator('#form-perfil').getByLabel('WhatsApp').fill('(19) 98888-7777');
  await page.getByRole('button',{name:'Salvar meu cadastro',exact:true}).click();
  await page.locator('#status-perfil').getByText('Seu cadastro foi atualizado.',{exact:true}).waitFor();
  assert.equal(perfis.clientes.telefone,'19988887777');
  await page.locator('#perfil').getByRole('button',{name:'Página inicial',exact:true}).click();
  await page.getByRole('button',{name:'Minhas solicitações',exact:true}).click();
  await page.locator('#lista-solicitacoes article').first().waitFor();
  // Apenas o cliente de proposta aceita prepara um teste; repetir não muda condições.
  pedidosPaginados = undefined;
  pedido.status = 'aceita'; pedido.valor_centavos = 15000;
  await page.locator('#solicitacoes').getByRole('button', {name:'Atualizar',exact:true}).click();
  await page.getByRole('button', {name:'Preparar pagamento de teste',exact:true}).click();
  await page.getByLabel('Forma de pagamento de teste').selectOption('credito_parcelado');
  await page.getByLabel('Parcelas de teste').selectOption('10');
  await page.getByRole('button', {name:'Registrar preparação de teste',exact:true}).click();
  await page.locator('#status-preparacao').getByText('Não foi possível confirmar a preparação.', {exact:false}).waitFor();
  assert.equal(await page.getByLabel('Forma de pagamento de teste').isDisabled(), true);
  assert.equal(await page.getByLabel('Parcelas de teste').isDisabled(), true);
  await page.getByRole('button', {name:'Conferir preparação de teste',exact:true}).click();
  await page.locator('#status-preparacao').getByText('Preparação registrada.', {exact:false}).waitFor();
  assert.deepEqual(preparacoes[0],preparacoes[1]);
  assert.deepEqual(preparacoes[1], {solicitacaoId:pedido.id,forma:'credito_parcelado',parcelas:10});
  assert.match(await page.locator('#resultado-preparacao').innerText(), /135,00/);
  assert.match(await page.locator('#resultado-preparacao').innerText(), /15,00/);
  assert.equal(await page.getByRole('button', {name:'Preparação de teste registrada',exact:true}).isDisabled(), true);
  await page.locator('#preparacao').getByRole('button', {name:'Voltar às solicitações',exact:true}).click();
  await page.getByRole('button', {name:'Preparar pagamento de teste',exact:true}).click();
  await page.locator('#status-preparacao').getByText('Preparação registrada.', {exact:false}).waitFor();
  assert.equal(preparacoes.length,2, 'reabrir resultado já confirmado não repete a chamada');
  await page.locator('#preparacao').getByRole('button', {name:'Voltar às solicitações',exact:true}).click();
  pedido.atualizado_em = '2026-11-19T12:45:00Z';
  await page.locator('#solicitacoes').getByRole('button', {name:'Atualizar',exact:true}).click();
  await page.getByRole('button', {name:'Preparar pagamento de teste',exact:true}).click();
  await page.getByRole('button', {name:'Registrar preparação de teste',exact:true}).click();
  await page.getByRole('button', {name:'Gerar checkout sandbox',exact:true}).click();
  const linkSandbox = page.getByRole('link', {name:'Abrir PagBank — sandbox',exact:true});
  await linkSandbox.waitFor();
  assert.equal(await linkSandbox.getAttribute('href'),'https://qa.pagamento.pagseguro.uol.com.br/pagamento?code=ficticio');
  assert.equal(await linkSandbox.getAttribute('rel'),'noopener noreferrer');
  assert.equal(await page.getByRole('button', {name:'Gerar checkout sandbox',exact:true}).isDisabled(),true);
  await page.locator('#preparacao').getByRole('button', {name:'Voltar às solicitações',exact:true}).click();
  for (const [indice,modo] of ['rede','http','resposta'].entries()) {
    falhaCheckout = modo;
    pedido.atualizado_em = `2026-11-19T12:${51+indice}:00Z`;
    await page.locator('#solicitacoes').getByRole('button',{name:'Atualizar',exact:true}).click();
    await page.getByRole('button',{name:'Preparar pagamento de teste',exact:true}).click();
    await page.getByRole('button',{name:'Registrar preparação de teste',exact:true}).click();
    const antes = chamadasCheckout;
    await page.getByRole('button',{name:'Gerar checkout sandbox',exact:true}).click();
    await page.getByText('Checkout pendente de conferência.',{exact:false}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Gerar checkout sandbox',exact:true}).isDisabled(),true);
    await page.locator('#preparacao').getByRole('button',{name:'Voltar às solicitações',exact:true}).click();
    await page.getByRole('button',{name:'Preparar pagamento de teste',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'Gerar checkout sandbox',exact:true}).isDisabled(),true);
    await page.getByText('Checkout pendente de conferência.',{exact:false}).waitFor();
    await page.getByRole('button',{name:'Consultar tentativa de checkout',exact:true}).click();
    await page.getByText('A tentativa salva está com resultado incerto.',{exact:false}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Gerar checkout sandbox',exact:true}).isDisabled(),true);
    assert.equal(chamadasCheckout,antes+1,'reabrir resultado incerto não chama o checkout');
    await page.locator('#preparacao').getByRole('button',{name:'Voltar às solicitações',exact:true}).click();
  }
  falhaCheckout = undefined;
  pedido.atualizado_em = '2026-11-19T13:00:00Z';
  await page.locator('#solicitacoes').getByRole('button', {name:'Atualizar',exact:true}).click();
  await page.getByRole('button', {name:'Preparar pagamento de teste',exact:true}).click();
  aguardarPreparacao = true;
  const iniciada = new Promise(resolve => {avisarPreparacaoIniciada = resolve;});
  await page.getByRole('button', {name:'Registrar preparação de teste',exact:true}).click();
  await page.locator('#status-preparacao').getByText('Conferindo orçamento', {exact:false}).waitFor();
  await iniciada;
  await page.evaluate(() => iniciarSessao(undefined));
  const recebida = page.waitForResponse(r => r.url().endsWith('/functions/v1/preparar-pagamento-teste'));
  liberarPreparacao();
  await (await recebida).finished();
  await page.evaluate(() => new Promise(requestAnimationFrame));
  assert.equal(await page.locator('#resultado-preparacao').textContent(), '');
  assert.equal(await page.locator('#pedido-preparacao').textContent(), '');
  assert.equal(await page.locator('#form-perfil input[name="email"]').inputValue(),'');
  assert.equal(await page.locator('#form-perfil input[name="telefone"]').inputValue(),'');
  await page.locator('#preparacao').getByRole('button', {name:'Voltar às solicitações',exact:true}).click();
  await page.getByRole('heading', {name:'Entrar na conta',exact:true}).waitFor();
  // A configuração real começa com login pendente. Nenhum OTP deve sair.
  autenticacaoProntaTeste = false;
  const antesDoBloqueio = chamadasApi;
  await page.reload();
  await page.locator('#aviso-homologacao').waitFor();
  await page.locator('#aviso-autenticacao').waitFor();
  await page.getByRole('button', { name: 'Minhas solicitações' }).click();
  await page.getByRole('heading', { name: 'Acesso de testes em preparação' }).waitFor();
  await page.locator('#resultado').getByRole('button', { name: 'Página inicial' }).click();
  await page.getByRole('button', { name: 'Sou Cliente' }).click();
  const cadastro = page.locator('[data-cadastro="cliente"]');
  await cadastro.getByLabel('Nome completo').fill('Pessoa fictícia');
  await cadastro.getByLabel('E-mail').fill('teste@example.invalid');
  await cadastro.getByLabel('WhatsApp').fill('11999999999');
  await cadastro.getByLabel('Cidade').fill('Cidade de teste');
  await cadastro.getByRole('button', { name: 'Continuar' }).click();
  await cadastro.getByRole('alert').getByText('O acesso por e-mail está em preparação', { exact: false }).waitFor();
  assert.equal(await page.evaluate(() => {
    const caminhos = [
      '/auth/v1/otp',
      '/auth/v1/verify',
      '/auth/v1/token?grant_type=password',
      '/auth/v1/signup',
      '/auth/v1/logout',
    ];
    return caminhos.every(caminho => {
      try { enviar(caminho, { email: 'teste@example.invalid', token: 'ficticio' }); return false; }
      catch { return true; }
    });
  }), true, 'transporte deve bloquear todos os endpoints de autenticação enquanto a homologação está pendente');
  assert.equal(chamadasApi, antesDoBloqueio);
  assert.equal(await page.evaluate(async () => {
    const script = document.createElement('script');
    script.textContent = 'window.codigoInjetadoExecutou = true';
    document.head.append(script);
    try {
      await fetch('https://destino-nao-autorizado.example.invalid/coleta');
      return false;
    } catch {
      return window.codigoInjetadoExecutou !== true;
    }
  }), true, 'CSP bloqueia código injetado e conexões fora da homologação');
  assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily), 'Arial, sans-serif', 'CSS autorizado pelo hash continua aplicado');
  assert.deepEqual(erros, []);
});


test('cadastro com oito dígitos retoma gravação incerta sem consumir outro código', async t => {
  const arquivos=['index.html','config.js','ambiente.js','cadastro.js','valores.js','simulacao.js','simulador.js','sessao.js','servicos.js','avaliacoes.js','conversa.js','transicoes-contratacao.js','pagamentos.js','perfil.js'];
  const server=createServer(async(req,res)=>{
    const arquivo=req.url==='/'?'index.html':req.url.slice(1);
    if(!arquivos.includes(arquivo)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
    res.end(await readFile(new URL('../'+arquivo,import.meta.url)));
  }).listen(0,'127.0.0.1');
  await once(server,'listening');t.after(()=>server.close());
  const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});
  t.after(()=>browser.close());const page=await browser.newPage();page.setDefaultTimeout(5000);
  let verificacoes=0,gravacoes=0;
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
    const req=route.request(), path=new URL(req.url()).pathname;
    if(path.endsWith('/otp')){
      assert.deepEqual(req.postDataJSON(),{email:'cliente@example.com',create_user:true});
      return route.fulfill({json:{}});
    }
    if(path.endsWith('/verify')){
      verificacoes++;
      assert.deepEqual(req.postDataJSON(),{email:'cliente@example.com',token:'12345678',type:'email'});
      return route.fulfill({json:{access_token:'sessao-ficticia',user:{id:'11111111-1111-4111-8111-111111111111'}}});
    }
    assert.equal(path,'/rest/v1/clientes');assert.equal(req.method(),'POST');
    assert.equal(req.headers().authorization,'Bearer sessao-ficticia');
    assert.equal(req.postDataJSON().usuario_id,'11111111-1111-4111-8111-111111111111');
    gravacoes++;
    return route.fulfill({status:gravacoes===1?503:201,body:''});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.getByRole('button',{name:'Sou Cliente',exact:true}).click();
  const form=page.locator('[data-cadastro="cliente"]');
  await form.getByLabel('Nome completo').fill('Pessoa fictícia');
  await form.getByLabel('E-mail',{exact:true}).fill('cliente@example.com');
  await form.getByLabel('WhatsApp').fill('11999999999');
  await form.getByLabel('Cidade').fill('Cidade de teste');
  await form.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.getByLabel('Código de confirmação').fill('12345678');
  await page.getByRole('button',{name:'Confirmar e salvar'}).click();
  await page.locator('#form-confirmacao').getByRole('alert').getByText('Não foi possível concluir',{exact:false}).waitFor();
  assert.equal(await page.getByLabel('Código de confirmação').isDisabled(),true);
  await page.getByRole('button',{name:'Confirmar e salvar'}).click();
  await page.getByRole('heading',{name:'Cadastro concluído',exact:true}).waitFor();
  assert.equal(verificacoes,1);assert.equal(gravacoes,2);
  assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
});

test('cadastro profissional aceita CPF, MEI e empresa em atividade regular ou ocasional', async t => {
  const arquivos=['index.html','config.js','ambiente.js','cadastro.js','valores.js','simulacao.js','simulador.js','sessao.js','servicos.js','avaliacoes.js','conversa.js','transicoes-contratacao.js','pagamentos.js','perfil.js'];
  const server=createServer(async(req,res)=>{
    const arquivo=req.url==='/'?'index.html':req.url.slice(1);
    if(!arquivos.includes(arquivo)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
    res.end(await readFile(new URL('../'+arquivo,import.meta.url)));
  }).listen(0,'127.0.0.1');
  await once(server,'listening');t.after(()=>server.close());
  const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});
  t.after(()=>browser.close());const page=await browser.newPage();page.setDefaultTimeout(5000);
  let tipo, atividade, gravacoes=0;
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
    const req=route.request(), path=new URL(req.url()).pathname;
    if(path.endsWith('/otp')) return route.fulfill({json:{}});
    if(path.endsWith('/verify')) return route.fulfill({json:{access_token:'sessao-ficticia',user:{id:'11111111-1111-4111-8111-111111111111'}}});
    assert.equal(path,'/rest/v1/profissionais');
    assert.equal(req.method(),'POST');
    const dados=req.postDataJSON();
    assert.equal(dados.tipo_prestador,tipo);
    assert.equal(dados.tipo_atividade,atividade);
    assert.equal(dados.publicado,undefined);
    assert.deepEqual(Object.keys(dados).sort(),['cidade','descricao','nome','servico','telefone','tipo_atividade','tipo_prestador','usuario_id'].sort());
    gravacoes++;
    return route.fulfill({status:201,body:''});
  });
  for(tipo of ['pessoa_fisica','mei','empresa']) for(atividade of ['regular','ocasional']) {
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.getByRole('button',{name:'Sou Profissional',exact:true}).click();
    const form=page.locator('[data-cadastro="profissional"]');
    await form.getByLabel('Nome completo').fill('Pessoa fictícia');
    await form.getByLabel('E-mail',{exact:true}).fill('prestador@example.invalid');
    await form.getByLabel('WhatsApp').fill('11999999999');
    await form.getByLabel('Cidade').fill('Cidade de teste');
    await form.getByLabel('Profissão ou serviço oferecido').fill('Costura');
    await form.locator('[name="tipo_prestador"]').selectOption(tipo);
    await form.locator('[name="tipo_atividade"]').selectOption(atividade);
    await form.getByRole('button',{name:'Continuar',exact:true}).click();
    await page.getByLabel('Código de confirmação').fill('12345678');
    await page.getByRole('button',{name:'Confirmar e salvar'}).click();
    await page.getByRole('heading',{name:'Cadastro concluído',exact:true}).waitFor();
  }
  assert.equal(gravacoes,6);
});

test('pedido de nota confirma leitura após envio incerto e não vaza após troca de sessão', async t => {
  const arquivos=['index.html','config.js','ambiente.js','cadastro.js','valores.js','simulacao.js','simulador.js','sessao.js','servicos.js','avaliacoes.js','conversa.js','transicoes-contratacao.js','pagamentos.js','perfil.js'];
  const server=createServer(async(req,res)=>{
    const arquivo=req.url==='/'?'index.html':req.url.slice(1);
    if(!arquivos.includes(arquivo)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
    res.end(await readFile(new URL('../'+arquivo,import.meta.url)));
  }).listen(0,'127.0.0.1');
  await once(server,'listening');t.after(()=>server.close());
  const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});
  t.after(()=>browser.close());const page=await browser.newPage();page.setDefaultTimeout(5000);

  const cliente='11111111-1111-4111-8111-111111111111';
  const profissional='22222222-2222-4222-8222-222222222222';
  const pedido={id:'77777777-7777-4777-8777-777777777777',cliente_usuario_id:cliente,profissional_usuario_id:profissional,titulo:'Costura de teste',descricao:'Reparo de roupa fictício',status:'concluida',valor_centavos:10000,atualizado_em:'2026-11-23T12:00:00Z'};
  let registro,gravacoes=0,adiar=false,liberar,avisar;
  const emEspera=new Promise(resolve=>{avisar=resolve;});
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.pathname==='/rest/v1/atendimentos_pedido_nota')return route.fulfill({json:[]});
    assert.equal(url.pathname,'/rest/v1/pedidos_nota_fiscal');
    assert.equal(req.headers().authorization,'Bearer cliente-teste');
    if(req.method()==='POST'){
      assert.deepEqual(req.postDataJSON(),{solicitacao_id:pedido.id});
      gravacoes++;
      registro={solicitacao_id:pedido.id,solicitante_usuario_id:cliente,estado:'solicitada',criado_em:'2026-11-23T12:01:00Z'};
      return route.abort('failed');
    }
    if(adiar) await new Promise(resolve=>{liberar=resolve;avisar();});
    return route.fulfill({json:registro?[registro]:[]});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(({cliente,pedido})=>{
    iniciarSessao({token:'cliente-teste',usuario:cliente});
    mostrar('solicitacoes');
    listaPedidos.append(mostrarPedido(pedido));
  },{cliente,pedido});
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByText('Nenhum pedido de nota fiscal registrado para esta contratação.',{exact:true}).waitFor();
  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Pedir nota ao profissional',exact:true}).click();
  await page.getByText('Não foi possível confirmar o pedido.',{exact:false}).waitFor();
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByText('Nota fiscal solicitada ao profissional.',{exact:false}).waitFor();
  assert.equal(gravacoes,1);
  assert.equal(await page.getByRole('button',{name:'Pedir nota ao profissional',exact:true}).isVisible(),false);
  adiar=true;
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await emEspera;
  await page.evaluate(()=>iniciarSessao(undefined));
  liberar();
  await page.waitForTimeout(50);
  assert.equal(await page.locator('#lista-solicitacoes').textContent(),'');
});

test('nota fiscal mantém consulta cancelada, acesso profissional e exige novo login ao expirar', async t => {
  const arquivos=['index.html','config.js','ambiente.js','cadastro.js','valores.js','simulacao.js','simulador.js','sessao.js','servicos.js','avaliacoes.js','conversa.js','transicoes-contratacao.js','pagamentos.js','perfil.js'];
  const server=createServer(async(req,res)=>{
    const arquivo=req.url==='/'?'index.html':req.url.slice(1);
    if(!arquivos.includes(arquivo)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
    res.end(await readFile(new URL('../'+arquivo,import.meta.url)));
  }).listen(0,'127.0.0.1');
  await once(server,'listening');t.after(()=>server.close());
  const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});
  t.after(()=>browser.close());const page=await browser.newPage();page.setDefaultTimeout(5000);

  const cliente='11111111-1111-4111-8111-111111111111';
  const profissional='22222222-2222-4222-8222-222222222222';
  const pedido={id:'77777777-7777-4777-8777-777777777777',cliente_usuario_id:cliente,profissional_usuario_id:profissional,titulo:'Costura de teste',descricao:'Reparo de roupa fictício',status:'cancelada',valor_centavos:10000,atualizado_em:'2026-11-23T12:00:00Z'};
  let registro={solicitacao_id:pedido.id,solicitante_usuario_id:cliente,estado:'solicitada',criado_em:'2026-11-23T12:01:00Z'};
  let expirar=false;
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.pathname==='/rest/v1/atendimentos_pedido_nota')return route.fulfill({json:[]});
    assert.equal(url.pathname,'/rest/v1/pedidos_nota_fiscal');
    assert.equal(req.method(),'GET','consulta cancelada e profissional nunca criam pedido');
    return expirar ? route.fulfill({status:401,json:{}}) : route.fulfill({json:registro?[registro]:[]});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const exibir=usuario=>page.evaluate(({usuario,pedido})=>{
    iniciarSessao({token:'sessao-teste',usuario});
    mostrar('solicitacoes');
    listaPedidos.append(mostrarPedido(pedido));
  },{usuario,pedido});
  await exibir(cliente);
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByText('Nota fiscal solicitada ao profissional.',{exact:false}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Pedir nota ao profissional',exact:true}).isVisible(),false);
  registro=undefined;
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByText('Nenhum pedido de nota fiscal registrado para esta contratação.',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Pedir nota ao profissional',exact:true}).isVisible(),false);
  registro={solicitacao_id:pedido.id,solicitante_usuario_id:cliente,estado:'solicitada',criado_em:'2026-11-23T12:01:00Z'};
  await exibir(profissional);
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByText('O cliente solicitou nota fiscal para esta contratação.',{exact:false}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Pedir nota ao profissional',exact:true}).isVisible(),false);
  registro={...registro,solicitante_usuario_id:profissional};
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByText('Não foi possível consultar o pedido de nota. Tente novamente.',{exact:true}).waitFor();
  expirar=true;
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByText('Sua sessão expirou. Entre novamente para continuar.',{exact:true}).waitFor();
  assert.equal(await page.locator('#lista-solicitacoes').textContent(),'');
});

test('profissional completa cadastro, pede análise sem publicar e recupera envio incerto',async t=>{
  const arquivos=['index.html','config.js','ambiente.js','cadastro.js','valores.js','simulacao.js','simulador.js','sessao.js','servicos.js','avaliacoes.js','conversa.js','transicoes-contratacao.js','pagamentos.js','perfil.js'];
  const server=createServer(async(req,res)=>{
    const arquivo=req.url==='/'?'index.html':req.url.slice(1);
    if(!arquivos.includes(arquivo)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
    res.end(await readFile(new URL('../'+arquivo,import.meta.url)));
  }).listen(0,'127.0.0.1');
  await once(server,'listening');t.after(()=>server.close());
  const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});
  t.after(()=>browser.close());const page=await browser.newPage();page.setDefaultTimeout(5000);

  const usuario='11111111-1111-4111-8111-111111111111';
  const perfil={usuario_id:usuario,nome:'Pessoa fictícia',cidade:'Cidade de teste',telefone:'11999999999',servico:'Costura',descricao:null,publicado:false,pausado:false,tipo_prestador:null,tipo_atividade:null};
  let pedido,gravacoes=0,adiar=false,liberar,avisar;
  const emEspera=new Promise(resolve=>{avisar=resolve;});
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url());
    assert.equal(req.headers().authorization,'Bearer sessao-teste');
    if(url.pathname==='/rest/v1/profissionais'){
      if(req.method()==='PATCH'){
        assert.equal(req.postDataJSON().publicado,undefined);
        Object.assign(perfil,req.postDataJSON());
        return route.fulfill({json:[{usuario_id:usuario,publicado:perfil.publicado,pausado:perfil.pausado}]});
      }
      return route.fulfill({json:[perfil]});
    }
    assert.equal(url.pathname,'/rest/v1/solicitacoes_analise_profissional');
    if(req.method()==='POST'){
      assert.deepEqual(req.postDataJSON(),{usuario_id:usuario});
      pedido={usuario_id:usuario,estado:'aguardando_analise',criado_em:'2026-11-23T13:00:00Z'};
      gravacoes++;return route.abort('failed');
    }
    if(adiar)await new Promise(resolve=>{liberar=resolve;avisar();});
    return route.fulfill({json:pedido?[pedido]:[]});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(usuario=>{
    iniciarSessao({usuario,token:'sessao-teste'});
    mostrar('perfil');tipoPerfil.value='profissional';carregarPerfil();
  },usuario);
  await page.locator('#form-perfil').waitFor();
  await page.getByRole('button',{name:'Consultar pedido de análise',exact:true}).click();
  await page.getByText('Atualize e salve seu cadastro profissional completo antes de pedir análise.',{exact:false}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Solicitar análise do perfil',exact:true}).isVisible(),false);
  await page.locator('#form-perfil [name="tipo_prestador"]').selectOption('pessoa_fisica');
  await page.locator('#form-perfil [name="tipo_atividade"]').selectOption('ocasional');
  await page.getByRole('button',{name:'Salvar meu cadastro',exact:true}).click();
  await page.getByText('Seu cadastro foi atualizado.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Consultar pedido de análise',exact:true}).click();
  await page.getByText('Nenhum pedido de análise registrado.',{exact:false}).waitFor();
  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Solicitar análise do perfil',exact:true}).click();
  await page.getByText('Não foi possível confirmar o pedido.',{exact:false}).waitFor();
  await page.getByRole('button',{name:'Consultar pedido de análise',exact:true}).click();
  await page.getByText('Pedido registrado. Seu perfil aguarda análise e ainda não foi publicado.',{exact:false}).waitFor();
  assert.equal(gravacoes,1);assert.equal(perfil.publicado,false);
  assert.equal(await page.getByRole('button',{name:'Solicitar análise do perfil',exact:true}).isVisible(),false);
  adiar=true;
  await page.getByRole('button',{name:'Consultar pedido de análise',exact:true}).click();
  await emEspera;
  await page.evaluate(()=>iniciarSessao(undefined));liberar();
  await page.waitForTimeout(50);
  assert.equal(await page.locator('#analise-profissional').isVisible(),false);
  assert.equal(await page.locator('#status-analise-profissional').textContent(),'');
});

test('edição material de perfil publicado informa nova análise com estado confirmado pelo banco',async t=>{
  const arquivos=['index.html','config.js','ambiente.js','cadastro.js','valores.js','simulacao.js','simulador.js','sessao.js','servicos.js','avaliacoes.js','conversa.js','transicoes-contratacao.js','pagamentos.js','perfil.js'];
  const server=createServer(async(req,res)=>{
    const arquivo=req.url==='/'?'index.html':req.url.slice(1);
    if(!arquivos.includes(arquivo)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
    res.end(await readFile(new URL('../'+arquivo,import.meta.url)));
  }).listen(0,'127.0.0.1');
  await once(server,'listening');t.after(()=>server.close());
  const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});
  t.after(()=>browser.close());const page=await browser.newPage();page.setDefaultTimeout(5000);

  const usuario='11111111-1111-4111-8111-111111111111';
  const perfil={usuario_id:usuario,nome:'Pessoa fictícia',cidade:'Cidade de teste',telefone:'11999999999',servico:'Costura',descricao:null,publicado:true,pausado:false,tipo_prestador:'pessoa_fisica',tipo_atividade:'regular'};
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url());
    assert.equal(url.pathname,'/rest/v1/profissionais');
    if(req.method()==='PATCH'){
      assert.equal(url.searchParams.get('select'),'usuario_id,publicado,pausado');
      assert.equal(req.postDataJSON().publicado,undefined);
      Object.assign(perfil,req.postDataJSON(),{publicado:false,pausado:false});
      return route.fulfill({json:[{usuario_id:usuario,publicado:false,pausado:false}]});
    }
    return route.fulfill({json:[perfil]});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(usuario=>{
    iniciarSessao({usuario,token:'sessao-teste'});mostrar('perfil');
    tipoPerfil.value='profissional';carregarPerfil();
  },usuario);
  await page.locator('#form-perfil').waitFor();
  await page.getByText('Seu perfil está visível na busca.',{exact:false}).waitFor();
  assert.equal(await page.locator('#analise-profissional').isVisible(),false);
  await page.locator('#form-perfil [name="servico"]').fill('Costura e ajustes');
  await page.getByRole('button',{name:'Salvar meu cadastro',exact:true}).click();
  await page.getByText('Cadastro salvo. Seu perfil saiu da busca e precisa de nova análise antes de ser publicado novamente.',{exact:true}).waitFor();
  assert.equal(await page.locator('#analise-profissional').isVisible(),true);
  assert.equal(await page.locator('#visibilidade-perfil').textContent(),'Seu perfil ainda não está publicado na busca. A publicação depende de análise.');
});

test('negociar proposta abre rascunho sem enviar, preserva edição e isola outra conta',async t=>{
  const arquivos=['index.html','config.js','ambiente.js','cadastro.js','valores.js','simulacao.js','simulador.js','sessao.js','servicos.js','avaliacoes.js','conversa.js','transicoes-contratacao.js','pagamentos.js','perfil.js'];
  const server=createServer(async(req,res)=>{
    const arquivo=req.url==='/'?'index.html':req.url.slice(1);
    if(!arquivos.includes(arquivo)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
    res.end(await readFile(new URL('../'+arquivo,import.meta.url)));
  }).listen(0,'127.0.0.1');
  await once(server,'listening');t.after(()=>server.close());
  const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});
  t.after(()=>browser.close());const page=await browser.newPage();page.setDefaultTimeout(5000);

  const cliente='11111111-1111-4111-8111-111111111111';
  const profissional='22222222-2222-4222-8222-222222222222';
  const pedido={id:'77777777-7777-4777-8777-777777777777',cliente_usuario_id:cliente,profissional_usuario_id:profissional,titulo:'Costura de teste',descricao:'Reparo de roupa fictício',status:'proposta',valor_centavos:10000,atualizado_em:'2026-11-23T12:00:00Z'};
  let escritas=0;
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(req.method()!=='GET')escritas++;
    assert.equal(req.method(),'GET','atalho não envia mensagens nem altera orçamento');
    if(url.pathname==='/rest/v1/solicitacoes')return route.fulfill({json:[pedido]});
    assert.ok(['/rest/v1/historico_solicitacoes','/rest/v1/mensagens_solicitacoes'].includes(url.pathname));
    return route.fulfill({json:[]});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(({cliente,pedido})=>{
    iniciarSessao({usuario:cliente,token:'sessao-teste'});mostrar('solicitacoes');
    listaPedidos.append(mostrarPedido(pedido));
  },{cliente,pedido});
  await page.getByRole('button',{name:'Negociar proposta',exact:true}).click();
  await page.locator('#form-mensagem').waitFor();
  assert.match(await page.locator('#form-mensagem [name="texto"]').inputValue(),/Gostaria de negociar este orçamento/);
  await page.locator('#form-mensagem [name="texto"]').fill('Podemos ajustar o prazo e o valor?');
  await page.getByRole('button',{name:'Voltar às solicitações',exact:true}).click();
  await page.getByRole('button',{name:'Negociar proposta',exact:true}).click();
  await page.locator('#form-mensagem').waitFor();
  assert.equal(await page.locator('#form-mensagem [name="texto"]').inputValue(),'Podemos ajustar o prazo e o valor?');
  await page.evaluate(({profissional,pedido})=>{
    iniciarSessao({usuario:profissional,token:'outra-sessao'});mostrar('solicitacoes');
    listaPedidos.append(mostrarPedido(pedido));abrirNegociacao(pedido);
  },{profissional,pedido});
  assert.equal(await page.getByRole('button',{name:'Negociar proposta',exact:true}).count(),0);
  assert.equal(await page.locator('#form-mensagem [name="texto"]').inputValue(),'');
  await page.getByText('A negociação desta proposta não está disponível para esta conta. Atualize a lista.',{exact:true}).waitFor();
  assert.equal(escritas,0);assert.equal(pedido.valor_centavos,10000);assert.equal(pedido.status,'proposta');
  assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
});

test('conversa atualiza orçamento e situação sem apagar rascunho nem mostrar resposta inválida',async t=>{
  const arquivos=['index.html','config.js','ambiente.js','cadastro.js','valores.js','simulacao.js','simulador.js','sessao.js','servicos.js','avaliacoes.js','conversa.js','transicoes-contratacao.js','pagamentos.js','perfil.js'];
  const server=createServer(async(req,res)=>{
    const arquivo=req.url==='/'?'index.html':req.url.slice(1);
    if(!arquivos.includes(arquivo)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
    res.end(await readFile(new URL('../'+arquivo,import.meta.url)));
  }).listen(0,'127.0.0.1');
  await once(server,'listening');t.after(()=>server.close());
  const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});
  t.after(()=>browser.close());const page=await browser.newPage();page.setDefaultTimeout(5000);

  const cliente='11111111-1111-4111-8111-111111111111';
  const pedido={id:'77777777-7777-4777-8777-777777777777',cliente_usuario_id:cliente,profissional_usuario_id:'22222222-2222-4222-8222-222222222222',titulo:'Costura de teste',descricao:'Reparo de roupa fictício',status:'proposta',valor_centavos:10000,atualizado_em:'2026-11-23T12:00:00Z'};
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url());
    assert.equal(req.method(),'GET','atualizar resumo não envia mensagens ou pagamentos');
    if(url.pathname==='/rest/v1/solicitacoes'){
      assert.ok(url.searchParams.get('select').includes('valor_centavos'));
      return route.fulfill({json:[pedido]});
    }
    assert.ok(['/rest/v1/historico_solicitacoes','/rest/v1/mensagens_solicitacoes'].includes(url.pathname));
    return route.fulfill({json:[]});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(({cliente,pedido})=>{
    iniciarSessao({usuario:cliente,token:'sessao-teste'});abrirConversa(pedido.id);
  },{cliente,pedido});
  await page.locator('#resumo-contratacao').waitFor();
  assert.equal(await page.locator('#situacao-atual-conversa').textContent(),'Situação atual: Proposta enviada');
  assert.match(await page.locator('#orcamento-atual-conversa').textContent(),/100,00/);
  await page.locator('#form-mensagem [name="texto"]').fill('Tenho uma dúvida sobre o prazo.');
  pedido.valor_centavos=15000;pedido.status='aceita';
  await page.getByRole('button',{name:'Atualizar histórico e mensagens',exact:true}).click();
  await page.getByText('Situação atual: Aceita',{exact:true}).waitFor();
  assert.match(await page.locator('#orcamento-atual-conversa').textContent(),/150,00/);
  assert.equal(await page.locator('#form-mensagem [name="texto"]').inputValue(),'Tenho uma dúvida sobre o prazo.');
  pedido.valor_centavos=-1;
  await page.getByRole('button',{name:'Atualizar histórico e mensagens',exact:true}).click();
  await page.getByText('Não foi possível carregar todos os dados. Tente atualizar.',{exact:true}).waitFor();
  assert.equal(await page.locator('#resumo-contratacao').isVisible(),false);
  assert.equal(await page.locator('#orcamento-atual-conversa').textContent(),'');
  assert.equal(await page.locator('#form-mensagem').isVisible(),false);
  await page.evaluate(()=>iniciarSessao(undefined));
  assert.equal(await page.locator('#situacao-atual-conversa').textContent(),'');
});

test('conversa indisponível libera controles, permite tentar novamente e voltar sem expor dados anteriores',async t=>{
  const arquivos=['index.html','config.js','ambiente.js','cadastro.js','valores.js','simulacao.js','simulador.js','sessao.js','servicos.js','avaliacoes.js','conversa.js','transicoes-contratacao.js','pagamentos.js','perfil.js'];
  const server=createServer(async(req,res)=>{
    const arquivo=req.url==='/'?'index.html':req.url.slice(1);
    if(!arquivos.includes(arquivo)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
    res.end(await readFile(new URL('../'+arquivo,import.meta.url)));
  }).listen(0,'127.0.0.1');
  await once(server,'listening');t.after(()=>server.close());
  const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});
  t.after(()=>browser.close());const page=await browser.newPage();page.setDefaultTimeout(5000);

  const cliente='11111111-1111-4111-8111-111111111111';
  const pedido={id:'77777777-7777-4777-8777-777777777777',cliente_usuario_id:cliente,profissional_usuario_id:'22222222-2222-4222-8222-222222222222',titulo:'Costura de teste',status:'proposta',valor_centavos:10000};
  let indisponivel=true;
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url());
    assert.equal(req.method(),'GET');
    if(url.pathname==='/rest/v1/solicitacoes'){
      return route.fulfill({json:url.searchParams.has('id')&&!indisponivel?[pedido]:[]});
    }
    assert.ok(['/rest/v1/historico_solicitacoes','/rest/v1/mensagens_solicitacoes'].includes(url.pathname));
    return route.fulfill({json:[]});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(({cliente,pedido})=>{
    iniciarSessao({usuario:cliente,token:'sessao-teste'});abrirConversa(pedido.id);
  },{cliente,pedido});
  await page.getByText('Solicitação indisponível.',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Atualizar histórico e mensagens',exact:true}).isEnabled(),true);
  assert.equal(await page.getByRole('button',{name:'Voltar às solicitações',exact:true}).isEnabled(),true);
  assert.equal(await page.locator('#form-mensagem').isVisible(),false);
  indisponivel=false;
  await page.getByRole('button',{name:'Atualizar histórico e mensagens',exact:true}).click();
  await page.locator('#resumo-contratacao').waitFor();
  assert.match(await page.locator('#orcamento-atual-conversa').textContent(),/100,00/);
  await page.locator('#form-mensagem [name="texto"]').fill('Texto de teste ainda não enviado');
  indisponivel=true;
  await page.getByRole('button',{name:'Atualizar histórico e mensagens',exact:true}).click();
  await page.getByText('Solicitação indisponível.',{exact:true}).waitFor();
  assert.equal(await page.locator('#titulo-conversa').textContent(),'');
  assert.equal(await page.locator('#orcamento-atual-conversa').textContent(),'');
  assert.equal(await page.locator('#form-mensagem [name="texto"]').inputValue(),'');
  assert.equal(await page.locator('#form-mensagem').isVisible(),false);
  await page.getByRole('button',{name:'Voltar às solicitações',exact:true}).click();
  await page.locator('#solicitacoes').waitFor();
  await page.getByText('Nenhuma solicitação encontrada.',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Atualizar',exact:true}).isEnabled(),true);
});

test('profissional pausa e retoma sem publicar perfil pendente nem alterar outros campos',async t=>{
  const arquivos=['index.html','config.js','ambiente.js','cadastro.js','valores.js','simulacao.js','simulador.js','sessao.js','servicos.js','avaliacoes.js','conversa.js','transicoes-contratacao.js','pagamentos.js','perfil.js'];
  const server=createServer(async(req,res)=>{
    const arquivo=req.url==='/'?'index.html':req.url.slice(1);
    if(!arquivos.includes(arquivo)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
    res.end(await readFile(new URL('../'+arquivo,import.meta.url)));
  }).listen(0,'127.0.0.1');
  await once(server,'listening');t.after(()=>server.close());
  const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});
  t.after(()=>browser.close());const page=await browser.newPage();page.setDefaultTimeout(5000);

  const usuario='11111111-1111-4111-8111-111111111111';
  const perfil={usuario_id:usuario,nome:'Pessoa fictícia',cidade:'Cidade',telefone:'11999999999',servico:'Costura',descricao:null,tipo_prestador:'pessoa_fisica',tipo_atividade:'ocasional',publicado:true,pausado:false};
  const alteracoes=[];
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url());
    assert.equal(url.pathname,'/rest/v1/profissionais');
    if(req.method()==='PATCH'){
      const dados=req.postDataJSON();assert.deepEqual(Object.keys(dados),['pausado']);
      alteracoes.push(dados.pausado);perfil.pausado=dados.pausado;
      return route.fulfill({json:[{usuario_id:usuario,publicado:perfil.publicado,pausado:perfil.pausado}]});
    }
    return route.fulfill({json:[perfil]});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(usuario=>{
    iniciarSessao({usuario,token:'sessao-teste'});mostrar('perfil');tipoPerfil.value='profissional';carregarPerfil();
  },usuario);
  await page.locator('#form-perfil').waitFor();
  page.on('dialog',dialog=>dialog.accept());
  await page.locator('#form-perfil [name="descricao"]').fill('Rascunho ainda não salvo');
  await page.getByRole('button',{name:'Pausar novos pedidos',exact:true}).click();
  await page.getByText('Perfil aprovado, mas pausado e fora da busca.',{exact:true}).waitFor();
  assert.equal(perfil.publicado,true);assert.equal(perfil.descricao,null);
  assert.equal(await page.locator('#form-perfil [name="descricao"]').inputValue(),'Rascunho ainda não salvo');
  await page.getByRole('button',{name:'Retomar novos pedidos',exact:true}).click();
  await page.getByText('Seu perfil está visível na busca.',{exact:true}).waitFor();
  perfil.publicado=false;perfil.pausado=true;
  await page.getByRole('button',{name:'Atualizar cadastro',exact:true}).click();
  await page.getByRole('button',{name:'Retomar novos pedidos',exact:true}).waitFor();
  await page.getByRole('button',{name:'Retomar novos pedidos',exact:true}).click();
  await page.getByText('Disponibilidade atualizada.',{exact:false}).waitFor();
  assert.equal(perfil.publicado,false);assert.equal(perfil.pausado,false);
  assert.deepEqual(alteracoes,[true,false,false]);
  assert.equal(await page.locator('#visibilidade-perfil').textContent(),'Seu perfil ainda não está publicado na busca. A publicação depende de análise.');
  assert.equal(await page.locator('#analise-profissional').isVisible(),true);
  await page.evaluate(()=>iniciarSessao(undefined));
  assert.equal(await page.locator('#disponibilidade-profissional').isVisible(),false);
});

test('profissional confirma atendimento fiscal com recuperação segura e cliente vê confirmação sem emissão',async t=>{
  const arquivos=['index.html','config.js','ambiente.js','cadastro.js','valores.js','simulacao.js','simulador.js','sessao.js','servicos.js','avaliacoes.js','conversa.js','transicoes-contratacao.js','pagamentos.js','perfil.js'];
  const server=createServer(async(req,res)=>{
    const arquivo=req.url==='/'?'index.html':req.url.slice(1);
    if(!arquivos.includes(arquivo)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
    res.end(await readFile(new URL('../'+arquivo,import.meta.url)));
  }).listen(0,'127.0.0.1');
  await once(server,'listening');t.after(()=>server.close());
  const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});
  t.after(()=>browser.close());const page=await browser.newPage();page.setDefaultTimeout(5000);

  const cliente='11111111-1111-4111-8111-111111111111';
  const profissional='22222222-2222-4222-8222-222222222222';
  const pedido={id:'77777777-7777-4777-8777-777777777777',cliente_usuario_id:cliente,profissional_usuario_id:profissional,titulo:'Costura de teste',descricao:'Reparo fictício',status:'concluida',valor_centavos:10000};
  let atendimento,entrega,recebimento,escritas=0,entregasEscritas=0,recebimentosEscritos=0;
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.pathname==='/rest/v1/pedidos_nota_fiscal')return route.fulfill({json:[{solicitacao_id:pedido.id,solicitante_usuario_id:cliente,estado:'solicitada',criado_em:'2026-11-23T13:00:00Z'}]});
    if(url.pathname==='/rest/v1/recebimentos_pedido_nota'){
      if(req.method()==='POST'){
        assert.equal(req.headers().authorization,'Bearer cliente');
        assert.deepEqual(req.postDataJSON(),{solicitacao_id:pedido.id});
        recebimentosEscritos++;
        recebimento={solicitacao_id:pedido.id,cliente_usuario_id:cliente,criado_em:'2026-11-24T22:00:00Z'};
        return route.abort('failed');
      }
      return route.fulfill({json:recebimento?[recebimento]:[]});
    }
    if(url.pathname==='/rest/v1/entregas_pedido_nota'){
      if(req.method()==='POST'){
        assert.equal(req.headers().authorization,'Bearer profissional');
        assert.deepEqual(req.postDataJSON(),{solicitacao_id:pedido.id});
        entregasEscritas++;
        entrega={solicitacao_id:pedido.id,profissional_usuario_id:profissional,criado_em:'2026-11-24T21:00:00Z'};
        return route.abort('failed');
      }
      return route.fulfill({json:entrega?[entrega]:[]});
    }
    assert.equal(url.pathname,'/rest/v1/atendimentos_pedido_nota');
    if(req.method()==='POST'){
      assert.equal(req.headers().authorization,'Bearer profissional');
      assert.deepEqual(req.postDataJSON(),{solicitacao_id:pedido.id});
      escritas++;atendimento={solicitacao_id:pedido.id,profissional_usuario_id:profissional,criado_em:'2026-11-23T13:01:00Z'};
      return route.abort('failed');
    }
    return route.fulfill({json:atendimento?[atendimento]:[]});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const exibir=(usuario,token)=>page.evaluate(({usuario,token,pedido})=>{
    iniciarSessao({usuario,token});mostrar('solicitacoes');listaPedidos.append(mostrarPedido(pedido));
  },{usuario,token,pedido});
  await exibir(profissional,'profissional');
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByRole('button',{name:'Confirmar atendimento do pedido de nota',exact:true}).waitFor();
  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Confirmar atendimento do pedido de nota',exact:true}).click();
  await page.getByText('Não foi possível confirmar o atendimento.',{exact:false}).waitFor();
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByText('Você confirmou o atendimento do pedido de nota.',{exact:false}).waitFor();
  assert.equal(escritas,1);
  await exibir(cliente,'cliente');
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByText('O profissional confirmou que está cuidando do pedido de nota fiscal. Esta confirmação não é uma nota emitida.',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Confirmar atendimento do pedido de nota',exact:true}).isVisible(),false);
  assert.equal(await page.getByRole('button',{name:'Informar entrega da nota ao cliente',exact:true}).isVisible(),false);
  await exibir(profissional,'profissional');
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByRole('button',{name:'Informar entrega da nota ao cliente',exact:true}).click();
  await page.getByText('Não foi possível confirmar a declaração de entrega.',{exact:false}).waitFor();
  assert.equal(entregasEscritas,1);
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByText('Você declarou a entrega da nota pelo canal combinado com o cliente.',{exact:false}).waitFor();
  assert.equal(entregasEscritas,1,'consultar após falha não repete escrita');
  assert.equal(await page.getByRole('button',{name:'Informar entrega da nota ao cliente',exact:true}).isVisible(),false);
  await exibir(cliente,'cliente');
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByText('O profissional declarou que entregou a nota pelo canal combinado.',{exact:false}).waitFor();
  await page.getByRole('button',{name:'Confirmar recebimento da nota',exact:true}).click();
  await page.getByText('Não foi possível confirmar o recebimento.',{exact:false}).waitFor();
  assert.equal(recebimentosEscritos,1);
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByText('Você confirmou o recebimento do documento pelo canal combinado.',{exact:false}).waitFor();
  assert.equal(recebimentosEscritos,1);
  assert.equal(await page.getByRole('button',{name:'Confirmar recebimento da nota',exact:true}).isVisible(),false);
  await exibir(profissional,'profissional');
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByText('O cliente confirmou o recebimento do documento pelo canal combinado.',{exact:false}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Confirmar recebimento da nota',exact:true}).isVisible(),false);
  await exibir(cliente,'cliente');
  recebimento={...recebimento,cliente_usuario_id:profissional};
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByText('Não foi possível consultar o pedido de nota. Tente novamente.',{exact:true}).waitFor();
  recebimento=undefined;
  entrega={...entrega,profissional_usuario_id:cliente};
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByText('Não foi possível consultar o pedido de nota. Tente novamente.',{exact:true}).waitFor();
  assert.equal(entregasEscritas,1);
  entrega=undefined;
  atendimento={...atendimento,profissional_usuario_id:cliente};
  await page.getByRole('button',{name:'Consultar pedido de nota fiscal',exact:true}).click();
  await page.getByText('Não foi possível consultar o pedido de nota. Tente novamente.',{exact:true}).waitFor();
  assert.equal(escritas,1);assert.equal(pedido.valor_centavos,10000);
});

test('painel de revisão nega acesso comum, não repete aprovação incerta e limpa dados ao trocar conta',async t=>{
  const arquivos=['index.html','config.js','ambiente.js','cadastro.js','valores.js','simulacao.js','simulador.js','sessao.js','servicos.js','avaliacoes.js','conversa.js','transicoes-contratacao.js','pagamentos.js','perfil.js'];
  const server=createServer(async(req,res)=>{
    const arquivo=req.url==='/'?'index.html':req.url.slice(1);
    if(!arquivos.includes(arquivo)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
    res.end(await readFile(new URL('../'+arquivo,import.meta.url)));
  }).listen(0,'127.0.0.1');
  await once(server,'listening');t.after(()=>server.close());
  const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});
  t.after(()=>browser.close());const page=await browser.newPage();page.setDefaultTimeout(5000);


  const revisor='44444444-4444-4444-8444-444444444444';
  const alvo='22222222-2222-4222-8222-222222222222';
  const perfil={nome:'<img src=x onerror=alert(1)>',cidade:'Cidade',servico:'Costura',descricao:'Perfil de teste',tipo_prestador:'pessoa_fisica',tipo_atividade:'ocasional'};
  let negado=true,aprovado=false,escritas=0,perderResposta=true;
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url());
    assert.equal(req.headers().authorization,'Bearer revisor');
    if(negado)return route.fulfill({status:403,json:{message:'Área restrita'}});
    if(url.pathname==='/rest/v1/rpc/listar_perfis_revisao'){
      assert.deepEqual(req.postDataJSON(),{pagina:0});
      return route.fulfill({json:aprovado?[]:[{usuario_id:alvo,solicitado_em:'2026-11-23T18:00:00Z',perfil}]});
    }
    assert.equal(url.pathname,'/rest/v1/rpc/aprovar_perfil_administrativo');
    assert.deepEqual(req.postDataJSON(),{alvo,esperado:perfil});
    escritas++;aprovado=true;
    if(perderResposta)return route.abort('failed');
    return route.fulfill({json:1});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(({revisor})=>{iniciarSessao({usuario:revisor,token:'revisor'});},{revisor});
  await page.getByRole('button',{name:'Área de revisão de profissionais',exact:true}).click();
  await page.getByText('Área reservada à conta revisora autorizada.',{exact:true}).waitFor();
  assert.equal(await page.locator('#lista-revisao article').count(),0);
  negado=false;
  await page.getByRole('button',{name:'Atualizar fila de análise',exact:true}).click();
  await page.getByRole('heading',{name:perfil.nome,exact:true}).waitFor();
  assert.equal(await page.locator('#lista-revisao img').count(),0);
  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Aprovar publicação de '+perfil.nome,exact:true}).click();
  await page.getByText('Não foi possível confirmar a aprovação.',{exact:false}).waitFor();
  assert.equal(escritas,1);
  assert.equal(await page.locator('#lista-revisao article').count(),0);
  await page.getByRole('button',{name:'Atualizar fila de análise',exact:true}).click();
  await page.getByText('Nenhum perfil pendente nesta página.',{exact:true}).waitFor();
  assert.equal(escritas,1);
  aprovado=false;perderResposta=false;
  await page.getByRole('button',{name:'Atualizar fila de análise',exact:true}).click();
  await page.getByRole('button',{name:'Aprovar publicação de '+perfil.nome,exact:true}).click();
  await page.getByText('Publicação aprovada.',{exact:false}).waitFor();
  assert.equal(escritas,2);
  await page.evaluate(()=>iniciarSessao(undefined));
  assert.equal(await page.locator('#lista-revisao article').count(),0);
  assert.equal(await page.locator('#status-revisao').textContent(),'');
});

test('revisor pede ajuste com recuperação e somente profissional titular consulta orientação',async t=>{
  const arquivos=['index.html','config.js','ambiente.js','cadastro.js','valores.js','simulacao.js','simulador.js','sessao.js','servicos.js','avaliacoes.js','conversa.js','transicoes-contratacao.js','pagamentos.js','perfil.js'];
  const server=createServer(async(req,res)=>{
    const arquivo=req.url==='/'?'index.html':req.url.slice(1);
    if(!arquivos.includes(arquivo)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
    res.end(await readFile(new URL('../'+arquivo,import.meta.url)));
  }).listen(0,'127.0.0.1');
  await once(server,'listening');t.after(()=>server.close());
  const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});
  t.after(()=>browser.close());const page=await browser.newPage();page.setDefaultTimeout(5000);



  const revisor='44444444-4444-4444-8444-444444444444',alvo='22222222-2222-4222-8222-222222222222';
  const perfil={nome:'Perfil fictício',cidade:'Cidade',servico:'Costura',descricao:'Descrição',tipo_prestador:'pessoa_fisica',tipo_atividade:'ocasional'};
  let motivo,escritas=0,perderResposta=true,invalida=false;
  page.on('dialog',dialog=>dialog.accept());
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.pathname==='/rest/v1/rpc/listar_perfis_revisao'){
      assert.equal(req.headers().authorization,'Bearer revisor');
      return route.fulfill({json:[{usuario_id:alvo,solicitado_em:'2026-11-23T18:00:00Z',perfil}]});
    }
    if(url.pathname==='/rest/v1/rpc/pedir_ajuste_perfil'){
      assert.equal(req.headers().authorization,'Bearer revisor');
      assert.deepEqual(req.postDataJSON(),{alvo,esperado:perfil,motivo_ajuste:'detalhar_servico'});
      escritas++;motivo='detalhar_servico';
      if(perderResposta){perderResposta=false;return route.abort('failed');}
      return route.fulfill({json:1});
    }
    assert.equal(url.pathname,'/rest/v1/rpc/consultar_orientacao_perfil');
    assert.deepEqual(req.postDataJSON(),{});
    const titular=req.headers().authorization==='Bearer profissional';
    return route.fulfill({json:titular?[{motivo:invalida?'texto_nao_permitido':motivo,criado_em:'2026-11-23T18:00:00Z',perfil_alterado:false}]:[]});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(({revisor})=>iniciarSessao({usuario:revisor,token:'revisor'}),{revisor});
  await page.getByRole('button',{name:'Área de revisão de profissionais',exact:true}).click();
  await page.getByRole('heading',{name:perfil.nome,exact:true}).waitFor();
  await page.getByLabel('Orientação para o profissional',{exact:true}).selectOption('detalhar_servico');
  await page.getByRole('button',{name:'Pedir ajuste de '+perfil.nome,exact:true}).click();
  await page.getByText('Não foi possível confirmar a orientação.',{exact:false}).waitFor();
  assert.equal(escritas,1);
  await page.getByRole('button',{name:'Atualizar fila de análise',exact:true}).click();
  await page.getByLabel('Orientação para o profissional',{exact:true}).selectOption('detalhar_servico');
  await page.getByRole('button',{name:'Pedir ajuste de '+perfil.nome,exact:true}).click();
  await page.getByText('Orientação registrada.',{exact:false}).waitFor();
  assert.equal(escritas,2);
  const abrirPerfil=(usuario,token)=>page.evaluate(({usuario,token})=>{
    iniciarSessao({usuario,token});mostrar('perfil');
    perfilEmTela={tipo:'profissional',usuario,publicado:false};
    areaAnaliseProfissional.hidden=false;
  },{usuario,token});
  await abrirPerfil(alvo,'profissional');
  await page.getByRole('button',{name:'Consultar orientação da revisão',exact:true}).click();
  await page.getByText('Orientação da revisão: Detalhar o serviço oferecido e sua descrição.',{exact:false}).waitFor();
  invalida=true;
  await page.getByRole('button',{name:'Consultar orientação da revisão',exact:true}).click();
  await page.getByText('Não foi possível consultar a orientação. Tente novamente.',{exact:true}).waitFor();
  await abrirPerfil('33333333-3333-4333-8333-333333333333','terceiro');
  assert.equal(await page.locator('#status-orientacao-profissional').textContent(),'');
  await page.getByRole('button',{name:'Consultar orientação da revisão',exact:true}).click();
  await page.getByText('Nenhuma orientação de ajuste pendente para seu cadastro.',{exact:true}).waitFor();
});

test('recusa administrativa exige motivo, recupera resposta perdida e permite consulta privada',async t=>{
  const arquivos=['index.html','config.js','ambiente.js','cadastro.js','valores.js','simulacao.js','simulador.js','sessao.js','servicos.js','avaliacoes.js','conversa.js','transicoes-contratacao.js','pagamentos.js','perfil.js'];
  const server=createServer(async(req,res)=>{
    const arquivo=req.url==='/'?'index.html':req.url.slice(1);
    if(!arquivos.includes(arquivo)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',arquivo.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
    res.end(await readFile(new URL('../'+arquivo,import.meta.url)));
  }).listen(0,'127.0.0.1');
  await once(server,'listening');t.after(()=>server.close());
  const browser=await chromium.launch({executablePath:process.env.TRAMPOFACIL_CHROMIUM||'/usr/bin/chromium'});
  t.after(()=>browser.close());const page=await browser.newPage();page.setDefaultTimeout(5000);




  const revisor='44444444-4444-4444-8444-444444444444',alvo='22222222-2222-4222-8222-222222222222';
  const perfil={nome:'Perfil fictício',cidade:'Cidade',servico:'Costura',descricao:'Descrição',tipo_prestador:'pessoa_fisica',tipo_atividade:'ocasional'};
  let recusa=null,escritas=0,perderResposta=true;
  page.on('dialog',dialog=>dialog.accept());
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.pathname==='/rest/v1/rpc/listar_perfis_revisao'){
      assert.equal(req.headers().authorization,'Bearer revisor');
      return route.fulfill({json:[{usuario_id:alvo,solicitado_em:'2026-11-24T18:00:00Z',perfil,recusa}]});
    }
    if(url.pathname==='/rest/v1/rpc/recusar_publicacao_perfil'){
      assert.equal(req.headers().authorization,'Bearer revisor');
      assert.deepEqual(req.postDataJSON(),{alvo,esperado:perfil,motivo_recusa:'servico_nao_identificavel'});
      escritas++;recusa={motivo:'servico_nao_identificavel',criado_em:'2026-11-24T18:00:00Z',perfil_alterado:false};
      if(perderResposta){perderResposta=false;return route.abort('failed');}
      return route.fulfill({json:1});
    }
    assert.equal(url.pathname,'/rest/v1/rpc/consultar_recusa_publicacao');
    assert.deepEqual(req.postDataJSON(),{});
    return route.fulfill({json:req.headers().authorization==='Bearer profissional'?[recusa]:[]});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(({revisor})=>iniciarSessao({usuario:revisor,token:'revisor'}),{revisor});
  await page.getByRole('button',{name:'Área de revisão de profissionais',exact:true}).click();
  await page.getByRole('heading',{name:perfil.nome,exact:true}).waitFor();
  await page.getByRole('button',{name:'Recusar publicação de '+perfil.nome,exact:true}).click();
  await page.getByText('Escolha o motivo antes de recusar a publicação.',{exact:true}).waitFor();
  assert.equal(escritas,0);
  await page.getByLabel('Motivo da recusa',{exact:true}).selectOption('servico_nao_identificavel');
  await page.getByRole('button',{name:'Recusar publicação de '+perfil.nome,exact:true}).click();
  await page.getByText('Não foi possível confirmar a recusa.',{exact:false}).waitFor();
  assert.equal(escritas,1);
  assert.equal(await page.locator('#lista-revisao article').count(),0);
  await page.getByRole('button',{name:'Atualizar fila de análise',exact:true}).click();
  await page.getByText('Última recusa registrada:',{exact:false}).waitFor();
  assert.equal(escritas,1,'consultar não repete a decisão');
  await page.getByLabel('Motivo da recusa',{exact:true}).selectOption('servico_nao_identificavel');
  await page.getByRole('button',{name:'Recusar publicação de '+perfil.nome,exact:true}).click();
  await page.getByText('Recusa registrada. O profissional pode consultar o motivo e corrigir o cadastro para reavaliação.',{exact:true}).waitFor();
  const abrir=(usuario,token)=>page.evaluate(({usuario,token})=>{
    iniciarSessao({usuario,token});mostrar('perfil');perfilEmTela={tipo:'profissional',usuario,publicado:false};
    areaAnaliseProfissional.hidden=false;
  },{usuario,token});
  await abrir(alvo,'profissional');
  await page.getByRole('button',{name:'Consultar decisão de publicação',exact:true}).click();
  await page.getByText('Última recusa de publicação: O serviço oferecido não está claro.',{exact:false}).waitFor();
  recusa={...recusa,perfil_alterado:true};
  await page.getByRole('button',{name:'Consultar decisão de publicação',exact:true}).click();
  await page.getByText('Seu cadastro mudou desde essa decisão.',{exact:false}).waitFor();
  await abrir('33333333-3333-4333-8333-333333333333','terceiro');
  assert.equal(await page.locator('#status-recusa-profissional').textContent(),'');
  await page.getByRole('button',{name:'Consultar decisão de publicação',exact:true}).click();
  await page.getByText('Nenhuma recusa de publicação pendente para seu cadastro.',{exact:true}).waitFor();
});
