# Revisão administrativa de profissionais — proposta
Data: 23/11/2026. Homologação: asdszqtpydiowgerxwee.

## Verificado
A fila existe com SELECT/INSERT restritos ao titular autenticado. O cadastro comum não possui UPDATE em profissionais.publicado.
Consulta em homologação: zero solicitações de análise e zero pendentes na fila.
O relatório consultar_fila_analise.sql foi executado somente para leitura e retornou vazio.

## Implementado nesta etapa
Relatório ordenado por solicitação mais antiga, excluindo perfis publicados e distinguindo cadastros incompletos. Sem telefone, e-mail, documentos ou dados bancários.
Teste isolado PGlite: fila com publicado, incompleto, completo e perfil sem solicitação; ordenação e ausência de alterações verificadas.
O relatório não é endpoint de aplicativo e não concede acesso administrativo a contas comuns.

## Alteração sensível proposta para etapa posterior
1. Lista privada de revisores por UUID de auth.users, concedida e revogada exclusivamente por administração autorizada. Não usar e-mail fixo ou user_metadata como autorização.
2. Decisões append-only com revisor, instante, decisão e versão exata dos campos analisados. Não armazenar documentos nem justificativas livres contendo dados pessoais.
3. Aprovar apenas perfil com solicitação existente, cadastro completo e revisão ainda válida; edição concorrente deve impedir aprovação antiga.
4. Aprovação altera somente publicação. Nunca altera pausado, identidade verificada, situação fiscal, contratos ou pagamentos.
5. Garantir repetição segura da mesma decisão e trilha de auditoria; prever nova análise após mudança material, sem reutilizar decisão antiga.
6. Operação administrativa estreita com validação no servidor e privilégios mínimos. Qualquer SECURITY DEFINER exige revisão explícita de proprietário, ACL, search_path e tabelas acessíveis.
7. Testes negativos: anônimo, titular, terceiro, revisor revogado, perfil alterado e chamada duplicada. Nenhuma política global de acesso para authenticated.

## Ainda não aplicado
Não foram criadas contas/roles de revisores, endpoints de aprovação, funções privilegiadas ou painel administrativo.
Antes de ativar aprovação será necessário apresentar a migração concreta e confirmar a identidade da conta revisora com o proprietário.
Nada nesta etapa representa verificação documental ou aprovação automática.
