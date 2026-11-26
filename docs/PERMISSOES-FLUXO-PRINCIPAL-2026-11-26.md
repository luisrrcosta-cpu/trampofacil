# Permissões do fluxo principal — 26/11/2026

Revisão de metadados somente de leitura no projeto TrampoFacil-Homologacao, asdszqtpydiowgerxwee. Consultas em transações BEGIN READ ONLY / ROLLBACK. Não foram lidos registros pessoais, executadas decisões administrativas, criadas identidades ou modificados dados/permissões.

| Tabela | RLS | SELECT anon | DELETE authenticated | Condição de acesso observada |
| --- | --- | --- | --- | --- |
| clientes | ativa | negado | negado | usuario_id corresponde a auth.uid(); INSERT/UPDATE com WITH CHECK |
| profissionais | ativa | negado | negado | usuario_id corresponde a auth.uid(); INSERT/UPDATE com WITH CHECK |
| solicitacoes | ativa | negado | negado | leitura/edição por cliente ou profissional participante; criação pelo cliente titular |
| mensagens_solicitacoes | ativa | negado | negado | leitura por participante; envio exige autor titular e pedido não concluído/cancelado |
| historico_solicitacoes | ativa | negado | negado | leitura por participante do pedido associado |

As políticas clientes_autenticacao_e_email, profissionais_autenticacao e solicitacoes_sessao_identificada são RESTRICTIVE. A verificação explícita do tipo é essencial: essas condições se somam às regras de titularidade, em vez de abrir acesso isoladamente. A política de clientes também confere e-mail do JWT na gravação. Não foi encontrada política adicional de leitura ampla nas cinco tabelas examinadas.

## Catálogo público limitado

catalogo_profissionais tem RLS ativa e política de SELECT usando ativo. anon pode consultar; anon e authenticated não podem inserir; authenticated não pode atualizar. A função public.buscar_profissionais é SECURITY INVOKER, com search_path vazio, autorizada para anon e authenticated, e retorna somente id, nome, cidade, servico e descricao. Consulta registros ativos, ordena por nome/id e limita a página a 20 resultados. Não retorna telefone, e-mail ou usuário interno.

## Alcance

Esta evidência confirma configuração de grants, predicados e tipo das políticas no instante consultado. Não substitui ensaio autenticado de todos os papéis, revisão de triggers, auditoria de todas as tabelas/funções, configuração Auth ou auditoria de produção. Não foram repetidos testes completos previamente aprovados. Nenhuma nova funcionalidade foi implementada nesta revisão.

Acesso do site permanece privado, sem convites; pagamentos reais continuam fora do escopo. A tentativa PagBank incerta não foi consultada nem reenviada por estas consultas.


## Complemento — publicação e transições de pedido

Conferidos quatro triggers ativos e seus corpos de função no schema private, todos com search_path vazio e sem EXECUTE direto para anon/authenticated:

- reavaliar_publicacao (BEFORE UPDATE): alteração material de nome, cidade, serviço, descrição ou classificação de perfil publicado remove a publicação.
- sincronizar_catalogo (AFTER INSERT/UPDATE): catálogo contém os campos públicos e marca ativo somente quando publicado e não pausado.
- validar_solicitacao (BEFORE INSERT/UPDATE): exige ator, cadastro cliente titular, profissional publicado/disponível e distinto do cliente na criação; define status inicial e valor nulo. Na atualização, bloqueia mudança de participantes/dados originais e valida transições por papel. Valor aceito não pode ser alterado.
- registrar_solicitacao (AFTER INSERT/UPDATE): grava estado e valor no histórico com o ator autenticado.

Grants por coluna em profissionais: authenticated não pode inserir/atualizar publicado, id ou criado_em; pode editar campos do perfil e atualizar pausado. A titularidade de usuario_id continua sujeita a USING/WITH CHECK das políticas anteriormente examinadas. A aprovação é feita pelo fluxo de revisão autorizado, não por UPDATE direto do profissional em publicado.

As funções de validação de pedido, histórico e sincronização de catálogo são SECURITY DEFINER; reavaliação é invoker. São funções trigger sem execução direta concedida aos papéis do cliente. Esta leitura não as executou e não testou identidades reais. Nenhum trigger, grant, política ou dado alterado.
