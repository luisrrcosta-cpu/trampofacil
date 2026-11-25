# Plano de verificação privada de profissionais — proposta
Data: 24/11/2026. Escopo ainda não implementado. Não autoriza coleta nem publicação de documentos.

## Situação confirmada no código
A aprovação administrativa atual autoriza a publicação do perfil. As telas já explicam que isso não comprova identidade, documentos ou habilitação. CPF, MEI e empresa são categorias declaradas; números de documentos não são coletados nesses formulários. Manter essas distinções.

## Entrega proposta por etapas
| Etapa | Resultado | Limite |
| --- | --- | --- |
| 1. Definir escopo | Selecionar finalidade, documentos mínimos, revisores e prazo de retenção | Sem upload ou pedido de documento ao usuário |
| 2. Homologação fictícia | Fluxo privado com arquivos sintéticos e contas de teste | Sem documentos reais, sem alteração de produção |
| 3. Revisão do fluxo | Comprovar isolamento, auditoria, revogação e expiração | Aprovação de publicação continua independente |
| 4. Decisão de lançamento | Revisar evidências e autorizar coleta separadamente | Não ativar coleta por simples continuação do desenvolvimento |

## Tipos de análise
| Tipo | O que se pretende conferir | O que não comprova |
| --- | --- | --- |
| Identidade | Correspondência entre titular e perfil, pelo procedimento escolhido | Qualidade do serviço, antecedentes ou regularidade tributária |
| Empresa/MEI | Correspondência do cadastro empresarial com o prestador | Permissão para qualquer atividade ou emissão de toda nota fiscal |
| Habilitação | Credencial específica para atividade previamente definida | Habilitação para outras atividades ou validade permanente |

Não oferecer selo genérico de “profissional verificado”. Se a etapa for aprovada, mostrar somente a conferência específica, data e eventual validade. Esta proposta não define quais profissões exigem habilitação: essa lista precisa de definição própria antes da implementação.

## Arquitetura proposta
- Documentos em armazenamento privado, separado do catálogo e das mensagens. Sem URL pública, nome original do arquivo ou número de documento no perfil público.
- Metadados privados mínimos: titular, tipo de análise, versão do perfil, estado e timestamps. Evitar duplicar números e conteúdo dos documentos.
- Titular consulta apenas seu processo. Revisor precisa de autorização específica para documentos; a função atual de revisar publicação não concede esse acesso automaticamente.
- Downloads autorizados no servidor e temporários. Chaves privilegiadas nunca chegam ao navegador. Limitar tipo e tamanho de arquivo; validar conteúdo real e tratar arquivos malformados.
- Decisão vinculada à versão analisada. Edição relevante, expiração ou revogação remove a indicação de conferência aplicável, preservando contratos e histórico.
- Auditoria privada de envio, acesso, decisão e revogação, sem copiar conteúdo de documentos ou links de acesso para logs.

## Estados e recuperação
Rascunho, enviado, em análise, ajustes solicitados, conferido, recusado, expirado e revogado. Reenvio gera nova versão do processo. Operações repetidas são idempotentes; resposta perdida exige consulta, sem criar outro processo automaticamente. A recusa documental não cancela contratos nem bloqueia a conta automaticamente.

## Evidências exigidas na homologação
1. Outro profissional, cliente e visitante não conseguem listar, enviar, ler ou baixar documentos alheios.
2. Revisor sem permissão documental, anônimo ou revogado perde acesso inclusive a operações concorrentes.
3. Links expirados e troca de sessão não reutilizam conteúdo; nenhum arquivo aparece em catálogo, histórico ou logs públicos.
4. Alteração do perfil durante a análise impede decisão sobre versão antiga.
5. Repetição e perda de resposta mantêm decisão única e trilha consistente.
6. Casos de arquivo inválido, tamanho excessivo, upload interrompido e falha do armazenamento retornam erro sem expor conteúdo.
7. Nenhum documento real é necessário para demonstrar esses casos.

## Decisões pendentes antes de solicitar arquivos reais
Finalidade e critérios de cada conferência; documentos mínimos aceitos; responsáveis autorizados; retenção e descarte; tratamento de contestação; texto de aviso ao titular; custos e eventual provedor externo. Não foi definido prazo automático de exclusão nem criado acesso adicional nesta etapa.

## Fora do escopo desta entrega
Biometria, selfie, consulta de antecedentes, coleta de dados bancários, emissão de nota fiscal, certificação automática e cobrança/repasse real. Nenhuma tabela, bucket, permissão ou tela de upload foi criada.
