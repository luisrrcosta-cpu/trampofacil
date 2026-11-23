# Aprovação de perfil — rascunho interno testado
Data: 23/11/2026. Não aplicado na homologação nem em produção.

## Implementação preparada
- private.revisores_perfil: lista privada por UUID; inicia vazia.
- private.aprovacoes_perfil: registro de revisor, perfil analisado, pedido e instante.
- private.aprovar_perfil_revisado(uuid,jsonb): rotina interna SECURITY INVOKER, search_path vazio, sem EXECUTE para PUBLIC, anon, authenticated ou service_role.
- Nenhum wrapper público, endpoint REST, revisor inicial ou grant de acesso ao schema.
- Aprovação exige revisor ativo, identidade distinta do prestador, solicitação de análise, modalidades preenchidas e igualdade exata dos seis campos públicos analisados.
- Locks de linha serializam revisão do perfil e revogação do revisor. A função muda apenas publicado; não altera pausado, documentos, contratos ou pagamentos.
- Repetição da mesma versão já publicada retorna o registro anterior. Uma versão diferente exige nova revisão.
- A função usa privilégios do chamador: não pode ser habilitada no navegador concedendo apenas EXECUTE. A integração com backend administrativo ainda precisa ser desenhada e revisada.

## Validação executada
Teste PGlite isolado aprovado: usuário com user_metadata.admin sem autorização, autoaprovação, anônimo, falta de solicitação, modalidade incompleta, cadastro alterado, sucesso, repetição, revogação e negação de execução/leitura para os três roles comuns.
Sem dados reais ou alteração remota. O teste usa claims simuladas; não valida login administrativo nem concorrência em PostgreSQL remoto.

## Limites para ativação
Este arquivo é proposta revisável, não migração pronta para aplicação automática. Requer revisão de integração, ACL, privilégios do chamador, trilha de concessão/revogação de revisores e teste de concorrência real antes de habilitar.
A manutenção de revisores e do histórico continua exclusiva da administração do banco; nenhuma permissão de alteração foi concedida ao aplicativo.
Não registra recusas ou pedidos de ajuste ainda. Não representa verificação de identidade, habilitação profissional ou situação fiscal.
Não aprovar perfis existentes para testar.

## Mudança sensível futura a apresentar ao proprietário
Criar as duas tabelas privadas e a rotina; selecionar explicitamente a identidade revisora; definir o backend administrativo e suas permissões mínimas.
Não ativar por e-mail fixo, user_metadata ou autorização implícita por cadastro.
O arquivo fica fora de supabase/migrations, em supabase/rascunhos, e nenhum script automático deve aplicá-lo.

Referência técnica consultada: https://supabase.com/docs/guides/database/functions (SECURITY INVOKER e permissões de execução).
