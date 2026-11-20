import postgres from 'npm:postgres@4.1.1';
import {criarServidorEdgeHomologacao, origemInterfaceHomologacao} from '../../../server/edge-homologacao.js';

// A autenticação ocorre em /auth/v1/user para cada POST, antes de abrir o banco.
// Não usar o corpo HTTP para configurar projeto, origem, conexão ou identidade.
let handler;
try {
  handler = criarServidorEdgeHomologacao({
    supabaseUrl: Deno.env.get('SUPABASE_URL'),
    bancoUrl: Deno.env.get('SUPABASE_DB_URL'),
    abrirBanco: postgres,
    // Origem da cópia privada de homologação; nunca aceitar wildcard.
    origemPermitida: Deno.env.get('TRAMPOFACIL_ORIGEM_HOMOLOGACAO') || origemInterfaceHomologacao,
  });
} catch {
  handler = () => new Response(JSON.stringify({erro:'SERVICO_NAO_CONFIGURADO'}), {
    status:503, headers:{'Content-Type':'application/json','Cache-Control':'no-store'},
  });
}
Deno.serve(handler);
