# Orientações de ajuste no cadastro — homologação
Revisor ativo pode pedir revisão do nome de apresentação, cidade ou detalhamento do serviço.
Motivos são enum fixo; não há mensagem livre, documentos ou condição de CNPJ para usar o aplicativo.
O pedido não altera perfil, publicação, disponibilidade, contratação ou pagamento.

## Segurança
Tabela private.ajustes_perfil com RLS e sem grants para contas comuns.
Funções privilegiadas em revisao_admin com search_path vazio; wrappers públicos SECURITY INVOKER.
Revisor conferido a cada escrita, com locks, versão exata e solicitação de análise existente; sem auto-orientação.
Repetição do mesmo motivo e mesma versão é idempotente.
Consulta do profissional não recebe UUID: usa auth.uid() e retorna somente motivo, instante e indicador de alteração do perfil.
Terceiros não consultam orientação de outro prestador; perfis já publicados não recebem orientação pendente.
A orientação não some quando o profissional edita: a tela informa que o cadastro mudou e ainda precisa de análise.
A interface limpa dados na troca de sessão e não repete gravação automaticamente após resposta incerta.

## Testes preparados
PGlite de roles/permissões, idempotência, versão antiga, revogação, motivos inválidos e privacidade.
Browser com API simulada: orientação, resposta perdida, repetição manual e consulta pelo titular sem parâmetro identificador.
Aplicação e publicação devem ser registradas após validação completa.

## Entrega confirmada — 23/11/2026
Migração orientacao_ajustes_perfil aplicada somente em asdszqtpydiowgerxwee.
Testes completos após correção do nome acessível do seletor: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45277018808 — sucesso. Finanças, concorrência PostgreSQL e prévia isolada também passaram.
Teste integrado real em BEGIN/ROLLBACK confirmou repetição segura da orientação e consulta pelo titular após alteração do cadastro, sem publicar perfis existentes.
Conferência após rollback: zero orientações, zero aprovações e zero identidades QA persistidas; authenticated sem leitura direta da tabela e sem USAGE em private.
O script validar_painel_revisao_rollback.sql foi ampliado para repetir essa validação após a migração.

Advisors: um INFO adicional para private.ajustes_perfil, com RLS e negação padrão intencional, totalizando oito tabelas internas sem política. Não conceder leitura ampla para remover o aviso.
Referência: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
Aviso pré-existente de proteção de senhas vazadas continua inalterado:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Publicação privada concluída: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_d637c8d4b02081918577a7d4cb88adf3.
Fonte hospedada: 33a56aeb85426db0c3dff4bdb192b2c6215fda31.
Fluxo com OTP real de orientação ainda não foi observado; interface testada com API simulada e banco com roles/claims simuladas.
Produção e pagamentos reais não foram alterados.
