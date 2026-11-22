# Segurança Auth — homologação TrampoFácil

Inspeção em 2026-11-22 no projeto Supabase `asdszqtpydiowgerxwee`.
Não envolve produção nem altera configurações.

## Aviso de segurança aberto
O Security Advisor retornou **WARN: auth_leaked_password_protection**:
proteção contra senhas vazadas desativada.

Ação recomendada: no painel Supabase do projeto **TrampoFacil-Homologacao**,
abrir Authentication > Settings (ou Security and Protection, conforme interface)
e habilitar a verificação de senhas comprometidas, caso disponível no plano.
Depois, repetir o Security Advisor para confirmar o aviso resolvido.

Referência: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Avisos informativos de RLS
O advisor também retornou **INFO: rls_enabled_no_policy** para quatro
tabelas financeiras privadas:
- `private.checkouts_pagbank_sandbox`
- `private.eventos_tentativa_pagamento_teste`
- `private.recebimentos_webhook_sandbox`
- `private.tentativas_pagamento_teste`

Nessas tabelas, a ausência de políticas de acesso público é intencional:
RLS está ativo e não há acesso direto de `anon`/`authenticated`.
**Não adicionar políticas permissivas apenas para silenciar o aviso.**

## Funções verificadas
As três funções abaixo são `SECURITY INVOKER`, sem EXECUTE para
`anon`/`authenticated`, com EXECUTE para `service_role`:
- `private.registrar_preparacao_pagamento`
- `private.registrar_tentativa_inerte`
- `private.receber_webhook_sandbox`

## Estado
A auditoria é somente leitura. A proteção contra senhas vazadas
**ainda não foi habilitada** nesta etapa.
