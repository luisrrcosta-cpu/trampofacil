# Nova análise após edição de perfil publicado — 23/11/2026

## Lacuna
O sincronizador do catálogo propagava imediatamente edições de nome, cidade, serviço e descrição de um perfil publicado. Isso permitia conteúdo diferente do aprovado sem nova análise.

## Correção de homologação
Trigger BEFORE UPDATE, SECURITY INVOKER, search_path vazio:
- Se o perfil estava publicado e nome, cidade, serviço, descrição, tipo_prestador ou tipo_atividade mudou, define publicado=false.
- Apenas telefone ou salvamento sem mudanças materiais preserva a publicação.
- Instalação não atualiza nem remove registros; atua em edições futuras.
- O sincronizador AFTER existente retira o perfil da busca na mesma transação.
- Nenhum novo privilégio de publicação, leitura de documentos ou aprovação.
- Administração continua responsável por revisar o perfil atual e publicar explicitamente.

A tela informa antes da edição que mudanças materiais exigem análise e, depois de salvar, usa o estado publicado retornado pelo banco para atualizar a visibilidade e liberar o pedido de análise. O cliente não envia publicado no PATCH.

## Verificação
Testes isolados cobrem todos os campos materiais, descrição nula, telefone, salvamento idêntico, impossibilidade de autopublicação e retirada do catálogo. Teste de navegador cobre retorno do banco e atualização imediata da tela.
Migração exclusiva de asdszqtpydiowgerxwee a aplicar após testes. Produção e pagamentos reais fora do escopo.
