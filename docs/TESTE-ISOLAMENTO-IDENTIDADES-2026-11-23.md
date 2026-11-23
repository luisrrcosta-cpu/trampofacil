# Teste de isolamento RLS — 2026-11-23

Ambiente: Supabase TrampoFacil-Homologacao (`asdszqtpydiowgerxwee`).

## Execução
Duas transações SQL separadas com `BEGIN READ ONLY`, `SET LOCAL ROLE authenticated`, claims JWT simuladas e `ROLLBACK`. UUIDs sintéticos terminados em `...0001` e `...0002`, sem vínculo intencional com contas reais. `auth.uid()` retornou o UUID simulado em cada transação.

Consultas: `SELECT count(*) FROM public.profissionais` e `SELECT count(*) FROM public.pedidos_nota_fiscal`.

| Identidade simulada | Perfis visíveis | Pedidos de nota visíveis |
|---|---:|---:|
| ...0001 | 0 | 0 |
| ...0002 | 0 | 0 |

## Limitações
- É teste de **leitura** com identidade simulada, não um login real no Supabase Auth.
- Não valida acesso legítimo de titulares com registros, tentativas de acesso cruzado quando há dados, INSERT/UPDATE/DELETE, nem comportamento HTTP da interface.
- Zero registros visíveis pode também ocorrer em tabelas vazias; não interpretar como prova completa de isolamento.

## Próximos passos
1. Testar com usuários fictícios de homologação e registros criados exclusivamente para testes, com autorização e plano de limpeza sem tocar em dados reais.
2. Validar fluxo de cadastro, edição e pedido de nota por HTTP autenticado.
3. Preservar GRANTs por coluna, políticas RESTRICTIVE e RLS existentes.

Nenhuma alteração em dados, esquema ou produção; nenhum pagamento real ativado.
