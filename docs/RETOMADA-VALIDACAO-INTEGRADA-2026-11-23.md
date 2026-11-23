# Retomada e validação integrada — 23/11/2026

## Base recuperada
Branch codex/v16-seguranca-integracoes, commit 2dbdd6ce5b6e7ef27cedf7c8c47d2091b13423d4.
CI confirmado: 230 testes, zero falhas (execução https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45226302957). Cadastro inclusivo, verificações financeiras e concorrência também aprovados.

## Pendência resolvida
O código de disponibilidade já estava corrigido/testado, mas a coluna profissionais.pausado não existia no banco de homologação. A migração disponibilidade_profissional foi aplicada apenas em asdszqtpydiowgerxwee. Perfil e catálogo existentes preservados; usuário pode editar pausado, continua sem editar publicado.

## Teste no PostgreSQL real de homologação
Executado supabase/homologacao/validar_fluxo_integrado_rollback.sql:
- Criou três identidades fictícias e perfis dentro de transação, sem e-mail ou credencial de login.
- Usou SET LOCAL ROLE authenticated/anon e claims simuladas para testar RLS e privilégios efetivos.
- Cadastro/upsert nas seis combinações CPF/MEI/empresa e atividade regular/ocasional.
- Atualização do titular e telefone internacional válido.
- Rejeição de e-mail diferente do claim, edição/upsert alheio e autopublicação.
- Pausa impede novo pedido e retira catálogo; retomada permite novo pedido se aprovado.
- Fluxo solicitada > proposta > aceita > em_andamento > entregue > concluida, com seis eventos e valor intacto.
- Nota permitida após aceite, unicidade, leitura das partes e bloqueio de terceiro, anônimo e emissão forjada.
- ROLLBACK integral: restaram os mesmos um cliente, um profissional e uma contratação; zero notas ou identidades QA persistidas.

Limite: validação de banco com papéis reais e claims simuladas, além de navegador com API simulada no CI. Não equivale a um novo login HTTP/OTP com duas contas reais nem a emissão de nota ou pagamento sandbox.

## Segurança
Sem novos apontamentos no advisor. Permanecem os quatro INFO de RLS sem políticas permissivas em tabelas privadas financeiras e o WARN de senhas vazadas desativadas. Não liberar tabelas financeiras para eliminar o aviso.
Referências: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Produção não alterada. Pagamentos reais e repasses continuam desabilitados.
