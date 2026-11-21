import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import { chromium } from 'playwright-core';

test('busca, autenticação e solicitação com repetição segura', async (t) => {
  let autenticacaoProntaTeste = true;
  const server = createServer(async (req, res) => {
    const arquivos = ['index.html', 'config.js', 'ambiente.js', 'cadastro.js', 'valores.js', 'simulacao.js', 'simulador.js', 'sessao.js', 'servicos.js', 'conversa.js', 'transicoes-contratacao.js', 'pagamentos.js', 'perfil.js'];
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
  const perfis = {clientes:{usuario_id:'11111111-1111-4111-8111-111111111111',nome:'Pessoa fictícia',email:'cliente@example.com',telefone:'11999999999',cidade:'São Paulo'},profissionais:{usuario_id:'22222222-2222-4222-8222-222222222222',nome:'Pessoa profissional',telefone:'11999999999',cidade:'São Paulo',servico:'Pintura',descricao:'Serviço de teste',publicado:false}};
  await page.route('https://asdszqtpydiowgerxwee.supabase.co/**', async (route) => {
    chamadasApi++;
    const req = route.request();
    const url = new URL(req.url());
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
      if (token !== '123456') return route.fulfill({ status: 400 });
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
        return route.fulfill({json:[{usuario_id:perfil.usuario_id}]});
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
        chats.unshift({ id: '00000000-0000-4000-8000-000000000032', criado_em: data, texto: dados.texto,
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
    await page.getByLabel('Código de acesso').fill('123456');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  }

  await entrar('cliente@example.com', true);
  await page.getByLabel('Título').fill('Pintar sala');
  await page.locator('#form-solicitacao').getByLabel('Descrição').fill('Pintar uma parede.');
  await page.getByRole('button', { name: 'Enviar solicitação' }).click();
  await page.getByText('Não foi possível confirmar o envio.', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Enviar solicitação' }).click();
  await page.getByText('Enviada · Solicitada').waitFor();
  assert.equal(criacoes.length, 2);
  assert.equal(criacoes[0].id, criacoes[1].id);
  assert.equal(await page.getByRole('button', { name: 'Enviar proposta' }).count(), 0);

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
  await page.locator('#solicitacoes').getByRole('button', { name: 'Página inicial' }).click();
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await page.getByRole('button', { name: 'Minhas solicitações' }).click();
  await entrar('profissional@example.com');
  await page.getByText('Recebida · Solicitada').waitFor();
  await page.locator('#solicitacoes').getByRole('button',{name:'Página inicial',exact:true}).click();
  await page.getByRole('button',{name:'Meu cadastro',exact:true}).click();
  await page.locator('#status-perfil').getByText('Você ainda não tem este cadastro.',{exact:false}).waitFor();
  await page.getByLabel('Tipo de cadastro').selectOption('profissional');
  await page.locator('#form-perfil').waitFor();
  await page.locator('#form-perfil').getByLabel('Serviço oferecido').fill('Pintura e acabamento');
  await page.getByRole('button',{name:'Salvar meu cadastro',exact:true}).click();
  await page.locator('#status-perfil').getByText('Seu cadastro foi atualizado.',{exact:true}).waitFor();
  assert.equal(perfis.profissionais.servico,'Pintura e acabamento');
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
  await page.getByText('Resposta fictícia', { exact: true }).waitFor();
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
    id: '00000000-0000-0000-0000-' + String(52 - i).padStart(12, '0'),
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
    try { enviar('/auth/v1/otp', {email:'teste@example.invalid'}); return false; }
    catch { return true; }
  }), true, 'transporte também deve bloquear autenticação pendente');
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

