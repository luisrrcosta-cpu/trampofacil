# Revisão interna aplicada — homologação
Data: 23/11/2026. Projeto: asdszqtpydiowgerxwee.
Autorização: proprietário confirmou a conta revisora nesta conversa.
Esta atualização substitui o estado “não aplicado” da proposta e do rascunho anteriores.

## Aplicado
Migração estrutura_interna_revisao_perfis: tabelas private.revisores_perfil, private.aprovacoes_perfil e private.eventos_revisores_perfil; rotina interna SECURITY INVOKER e trigger de auditoria de concessão/revogação.
Conta verificada e não anônima registrada como revisora em DML separado, sem credenciais, endereço de e-mail ou UUID real no código versionado.
Nenhuma aprovação executada e nenhum perfil alterado.
A rotina não tem EXECUTE para PUBLIC, anon, authenticated ou service_role; não foi criado endpoint público nem grant de schema.

## Conferido no banco
- 1 revisor ativo; 1 evento de concessão; 0 aprovações.
- RLS ativa nas três tabelas privadas.
- authenticated sem UPDATE em profissionais.publicado e sem EXECUTE na rotina.
- Teste PostgreSQL em BEGIN/ROLLBACK bloqueou chamada sem identidade e autoaprovação. Claims simuladas somente nesta transação; nenhum login foi contornado.
- Teste isolado PGlite do SQL aplicado passou, incluindo auditoria de concessão e revogação.

## Advisors
Quatro INFO rls_enabled_no_policy anteriores passaram a sete: as três tabelas internas novas usam RLS sem políticas e sem grants como negação padrão intencional. Não abrir políticas para remover o aviso.
Referência: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
O aviso pré-existente de proteção de senhas vazadas permanece inalterado; o fluxo atual é por OTP.
Referência: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Ainda pendente
Painel administrativo, backend de sessão revisora, visualização privada da fila, decisão pelo aplicativo, recusas e solicitações de ajuste.
O registro como revisor ainda não permite aprovar pela interface. Integração deve manter privilégios mínimos e autenticação verificada, sem service_role no navegador ou user_metadata como autorização.
Não reaplicar esta migração nem inserir novamente o revisor. Consultar estado antes de qualquer retomada.
Produção e pagamentos reais fora do escopo.
