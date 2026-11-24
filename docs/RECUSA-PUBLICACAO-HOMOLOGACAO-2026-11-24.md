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
