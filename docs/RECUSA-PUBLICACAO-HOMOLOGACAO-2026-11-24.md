# Recusa administrativa de publicação — 24/11/2026
Escopo: homologação asdszqtpydiowgerxwee.

## Comportamento
Revisor ativo registra recusa de publicação somente de perfil não publicado, com solicitação de análise existente e versão exata dos campos de apresentação.
Motivos fechados: informações inconsistentes, apresentação inadequada ou serviço não identificável. Não há motivo que exclua CPF, MEI, CNPJ ou serviços ocasionais.
Não bloqueia conta, não apaga perfil e não altera contratos, disponibilidade ou pagamentos.
O profissional consulta somente sua decisão, com orientação para corrigir o cadastro; a fila continua acessível ao revisor para reconsideração.
Aprovação posterior de versão revista é permitida. O histórico da recusa permanece privado.
A recusa não é banimento permanente nem verificação documental.

## Segurança
Tabela private.recusas_publicacao_perfil com RLS e sem grants diretos.
Funções privilegiadas somente em revisao_admin, search_path vazio, wrappers públicos invoker.
Revisor ativo validado em cada chamada; sem auto-recusa, sem decisão sobre versão antiga e sem recusa de perfil já publicado.
A consulta do titular não aceita UUID de outro usuário e retorna apenas motivo, data e indicador de alteração do cadastro.
Repetição só reutiliza a decisão mais recente com mesmo motivo e versão.
Resposta incerta não repete POST automaticamente; a interface exige atualizar a fila.
A fila mostra a última recusa e se o perfil mudou desde então.

## Validação preparada
PGlite: comum, revisor, anônimo, terceiro, revogado, motivos inválidos, versão antiga, repetição, correção e aprovação posterior.
Browser com API simulada: motivo obrigatório, perda de resposta, consulta sem repetir decisão e acompanhamento privado pelo titular.
Aplicação e publicação devem ser registradas após os testes completos. Não recusar perfis existentes para testar.


## Validação concluída — 24/11/2026

Implementação: `904e138bf31735b307e3866222f81e429650fb82`, branch `codex/v16-seguranca-integracoes`.

- CI aprovada: testes isolados/interface (45511567792), prévia isolada (45511567834), concorrência PostgreSQL (45511567809) e testes financeiros (45511567793).
- Migração `recusa_publicacao_perfil` aplicada exclusivamente em `asdszqtpydiowgerxwee`.
- Fluxo integrado executado com dados fictícios e ROLLBACK: recusa, repetição idempotente, consulta do proprietário, resumo da fila e aprovação posterior. Sem alteração de perfis existentes.
- Verificação posterior: 0 recusas, 0 aprovações, 1 profissional e 1 revisor ativo; authenticated sem SELECT direto no histórico privado.
- Advisor: nove INFO de RLS sem políticas nas tabelas privadas com bloqueio intencional; aviso de proteção de senhas vazadas preexistente, sem alteração nesta entrega. Referência: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Telas empacotadas no commit de hospedagem `51c046012f76efc6aaa83c74559cda11fed24ef0`; publicação privada é acompanhada separadamente. Produção e pagamentos reais preservados.
