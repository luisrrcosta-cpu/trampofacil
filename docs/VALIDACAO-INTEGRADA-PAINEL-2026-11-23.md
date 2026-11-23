# Validação integrada do painel de revisão — 23/11/2026

## Ambiente e método
Executado em TrampoFacil-Homologacao (asdszqtpydiowgerxwee), com funções, RLS, grants e triggers reais.
Identidades fictícias qa-UUID@example.invalid e claims simuladas em BEGIN/ROLLBACK. Não enviou e-mail/OTP e não equivale a login HTTP real.
Script: supabase/homologacao/validar_painel_revisao_rollback.sql.

## Aprovado
- Titular não lê a fila administrativa.
- Revisor ativo consulta o perfil com a versão exata, sem acesso direto às tabelas privadas.
- Autoaprovação bloqueada.
- Aprovação repetida retorna a mesma decisão, sem duplicar auditoria.
- Aprovar perfil pausado preserva pausado e não ativa o catálogo.
- Retomada pelo titular de perfil aprovado ativa o catálogo.
- Edição material remove publicação e desativa o catálogo.
- Aprovação com versão anterior é recusada.
- Nova versão aprovada gera auditoria própria.
- Revogação bloqueia leitura e aprovação imediatamente na chamada seguinte.
- Terceiro com user_metadata.admin continua sem acesso.

## Ajuste do teste
A primeira tentativa inseria pausado no INSERT de profissionais. O grant existente não permite essa coluna no cadastro inicial e bloqueou corretamente.
O teste foi corrigido para cadastrar com os campos autorizados e depois pausar pelo UPDATE do titular, conforme o fluxo do aplicativo. Nenhum privilégio foi ampliado.

## Preservação conferida
Antes e depois: zero identidades QA, um profissional, um perfil ativo no catálogo, zero aprovações persistidas, um revisor e um evento de concessão.
A transação foi revertida; não houve aprovação de perfil existente, exclusão, pagamento ou mudança em produção.
Sequências internas podem avançar mesmo em rollback; não pressupor numeração contínua como prova de alteração persistida.

## Limites
Cenários executados sequencialmente. Não constitui teste de duas transações concorrentes de aprovação.
Login HTTP real no painel pela conta revisora ainda não foi observado. O fluxo manual anterior de contratação e nota continua concluído e não precisa ser repetido.
