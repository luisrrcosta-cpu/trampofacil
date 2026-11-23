# Revisão de testes e Security Advisor — 2026-11-23

## Escopo
Inspeção de código e consulta de segurança somente leitura no Supabase de homologação `asdszqtpydiowgerxwee`. Nenhuma migração, mudança de política ou deploy.

## Testes já presentes no GitHub
- `tests/cadastro-inclusivo.test.js`: PGlite, compatibilidade com cadastros antigos, seis combinações de tipo de prestador/atividade, rejeição de valores inválidos, bloqueio de edição de outro usuário e de `publicado`.
- `tests/nota-fiscal.test.js`: PGlite, cliente participante solicita em estados permitidos; impede duplicidade, estados inválidos, alteração do emitente/estado, UPDATE/DELETE; profissional lê, terceiro não; valor financeiro preservado.

**Limite:** inspeção dos arquivos, não execução destes testes nesta revisão. PGlite não substitui testes reais HTTP/contas distintas no Supabase.

## Security Advisor de homologação
- `WARN auth_leaked_password_protection`: proteção contra senhas vazadas desativada. Guia oficial: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- `INFO rls_enabled_no_policy` em quatro tabelas privadas financeiras: `private.checkouts_pagbank_sandbox`, `private.eventos_tentativa_pagamento_teste`, `private.recebimentos_webhook_sandbox`, `private.tentativas_pagamento_teste`. Não criar políticas públicas para eliminar o aviso; verificar privilégios internos conforme necessidade.
- Nenhum novo aviso de severidade maior retornado nesta consulta.

## Próximos passos
1. Executar testes automatizados em CI e confirmar execução recente.
2. Testar cadastro e solicitação de nota via HTTP com duas contas de teste, sem tocar em dados reais.
3. Avaliar ativação da proteção contra senhas vazadas nas configurações de Auth, sem desabilitar métodos existentes.
4. Coordenar qualquer alteração de banco com o Work para evitar conflitos.

Produção preservada; pagamentos reais desativados.
