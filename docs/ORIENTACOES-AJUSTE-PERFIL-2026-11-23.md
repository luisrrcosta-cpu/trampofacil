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
