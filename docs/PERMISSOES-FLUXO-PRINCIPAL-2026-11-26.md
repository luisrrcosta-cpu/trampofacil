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
