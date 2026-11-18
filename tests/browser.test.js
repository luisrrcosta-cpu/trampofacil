import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import { chromium } from 'playwright-core';

test('busca, autenticação e solicitação com repetição segura', async (t) => {
  const server = createServer(async (req, res) => {
    const arquivos = ['index.html', 'config.js', 'cadastro.js', 'servicos.js'];
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
  assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
  assert.deepEqual(erros, []);
});
