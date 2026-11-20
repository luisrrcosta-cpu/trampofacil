import {criarAdaptadoresHomologacao} from './supabase-homologacao.js';
import {criarPreparadorPagamento} from './preparar-pagamento.js';
import {criarHandlerPreparacao} from './handler-preparacao.js';

export const projetoHomologacao = 'asdszqtpydiowgerxwee';
export const urlHomologacao = `https://${projetoHomologacao}.supabase.co`;
export const nomeFuncaoPreparacao = 'preparar-pagamento-teste';
export const origemInterfaceHomologacao = 'https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site';
const chavePublicavel = 'sb_publishable_LqyoPHGK1jifRxab6vPgYg_H26zanvz';

// Executado apenas no servidor. Nunca imprimir a URL/objeto retornado: contém
// a credencial de banco fornecida automaticamente pelo ambiente da função.
export function validarConexaoBancoHomologacao(valor) {
  let url;
  try { url = new URL(valor); } catch { throw new Error('Banco de homologação não configurado.'); }
  const usuario = decodeURIComponent(url.username);
  const direto = url.hostname === `db.${projetoHomologacao}.supabase.co` && usuario === 'postgres';
  const pool = /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname) && usuario === `postgres.${projetoHomologacao}`;
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !(direto || pool) ||
      !['', '5432', '6543'].includes(url.port) || url.pathname !== '/postgres' ||
      url.search || url.hash || !url.password) {
    throw new Error('Conexão permitida somente ao banco de homologação.');
  }
  return {
    host: url.hostname, port: Number(url.port || 5432), database: 'postgres', username: usuario,
    password: decodeURIComponent(url.password), ssl: {rejectUnauthorized: true},
    prepare: false, max: 1, idle_timeout: 5, connect_timeout: 5,
    queue_timeout: 5, query_timeout: 10, cancel_timeout: 2,
    connection: {statement_timeout: 5000, lock_timeout: 3000},
  };
}

export function criarServidorEdgeHomologacao({supabaseUrl, bancoUrl, abrirBanco, fetchImpl=globalThis.fetch, origemPermitida=origemInterfaceHomologacao}={}) {
  if (supabaseUrl !== urlHomologacao || typeof abrirBanco !== 'function') {
    throw new Error('Serviço restrito ao projeto de homologação.');
  }
  const adaptadores = criarAdaptadoresHomologacao({
    ambiente:'teste', projetoHomologacaoConfirmado:true, supabaseUrl, chavePublicavel, fetchImpl,
  });
  let banco;
  const registrarPreparacao = async dados => {
    // Conexão tardia: token inválido ou orçamento não autorizado não abre banco.
    banco ??= abrirBanco(validarConexaoBancoHomologacao(bancoUrl));
    return banco.begin(async transacao => {
      await transacao`set local role service_role`;
      // Valores interpolados na tagged template são parâmetros do driver.
      const linhas = await transacao`
        select id from private.registrar_preparacao_pagamento(
          ${dados.solicitacaoId}::uuid, ${dados.clienteUsuarioId}::uuid,
          ${dados.versaoOrcamento}::timestamptz, ${dados.forma}::text, ${dados.parcelas}::integer
        )`;
      if (linhas.length !== 1) throw new Error('Registro não confirmado.');
      return {id: linhas[0].id};
    });
  };
  const preparador = criarPreparadorPagamento({ambiente:'teste', ...adaptadores, registrarPreparacao});
  const handle = criarHandlerPreparacao({preparador, origemPermitida});
  return async request => {
    const url = new URL(request.url);
    if (url.search || ![`/${nomeFuncaoPreparacao}`, `/functions/v1/${nomeFuncaoPreparacao}`].includes(url.pathname)) {
      return new Response(JSON.stringify({erro:'ROTA_INDISPONIVEL'}), {
        status:404, headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},
      });
    }
    url.pathname = '/api/pagamentos/preparar';
    return handle(new Request(url, request));
  };
}
