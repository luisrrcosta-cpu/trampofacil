import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import { chromium } from 'playwright-core';

test('busca, autenticação e solicitação com repetição segura', async (t) => {
  const server = createServer(async (req, res) => {
    const arquivos = ['index.html', 'config.js', 'cadastro.js', 'servicos.js', 'conversa.js'];
    const arquivo = req.url === '/' ? 'index.html' : req.url.slice(1);
    if (!arquivos.includes(arquivo)) {
      res.writeHead(404).end();
      return;
    }
    if (arquivo === 'config.js') {
      res.setHeader('Content-Type', 'application/javascript');
      res.end("window.TRAMPOFACIL_SUPABASE = {url:'https://teste.supabase.co',chavePublicavel:'sb_publishable_teste'};");
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
  const erros = [];
  page.on('pageerror', (error) => erros.push(error.message));
  const profissional = {
    id: 'perfil-teste', nome: '<img src=x onerror=alert(1)>',
    cidade: 'São Paulo', servico: 'Pintura', descricao: 'Paredes internas',
  };
  let pedido;
  let falharAtualizacao = true;
  const criacoes = [];
  const data = '2026-11-18T12:00:00+00:00';
  const chats = Array.from({ length: 31 }, (_, i) => ({
    id: String(31 - i), criado_em: data, autor_usuario_id: 'profissional', texto: `Mensagem fictícia ${31 - i}`,
  }));
  let rejeitarMensagem = false;
  let expirarSessao = false;
  let perderResposta = false;
  let tentativasMensagem = 0;
  await page.route('https://teste.supabase.co/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
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
      return route.fulfill({ json: { access_token: id, user: { id } } });
    }
    assert.match(req.headers().authorization, /^Bearer (cliente|profissional)$/);
    if (url.pathname.endsWith('/historico_solicitacoes')) {
      assert.equal(url.searchParams.get('select'), 'id,criado_em,status,valor_centavos');
      assert.equal(url.searchParams.get('solicitacao_id'), 'eq.' + pedido.id);
      return route.fulfill({ json: [{ id: 'evento', criado_em: data, status: 'solicitada', valor_centavos: null }] });
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
        chats.unshift({ id: '32', criado_em: data, texto: dados.texto,
          autor_usuario_id: req.headers().authorization.split(' ').at(-1) });
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
        assert.equal(anterior, `(criado_em.lt.${data},and(criado_em.eq.${data},id.lt.2))`);
        return route.fulfill({ json: chats.slice(-1) });
      }
      return route.fulfill({ json: chats.slice(0, 31) });
    }
    if (req.method() === 'POST') {
      const dados = req.postDataJSON();
      criacoes.push(dados);
      assert.equal(dados.cliente_usuario_id, 'cliente');
      assert.equal(dados.profissional_id, 'perfil-teste');
      if (pedido) return route.fulfill({ status: 409 });
      pedido = { ...dados, status: 'solicitada', valor_centavos: null, atualizado_em: '2026-11-18T00:00:00+00:00' };
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
    return route.fulfill({ json: pedido ? [pedido] : [] });
  });

  await page.goto(`http://127.0.0.1:${server.address().port}`);
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
  await campoMensagem.waitFor();
  assert.equal(await campoMensagem.inputValue(), 'Rascunho de teste');

  expirarSessao = true;
  await botaoMensagem.click();
  await page.getByText('Sua sessão expirou.', { exact: false }).waitFor();
  await entrar('cliente@example.com');
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
  assert.deepEqual(erros, []);
});
