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
Migração reavaliar_publicacao_profissional aplicada somente em asdszqtpydiowgerxwee após aprovação dos testes. Produção e pagamentos reais fora do escopo.

## Resultado confirmado
- 221 testes aprovados, zero falhas: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45190117683 . Verificações financeiras, concorrência e prévia isolada também passaram.
- Conferência real: função SECURITY INVOKER, trigger instalado, usuário sem privilégio de publicação. Um perfil existente e publicado preservado durante a instalação.
- Auditoria sem novos apontamentos; referências anteriores em docs/VALIDACAO-CADASTROS-HOMOLOGACAO-2026-11-23.md.
- Publicação privada concluída: versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_d12b9a89a5588191ace49e9ec4e3cb18; deployment appgdep_6b04481e4a608191a87ede6ed8e1dd1a.
- Fonte da interface db40060dc775911ebff1167a383aabe4b2cab738; hospedagem e6bcb4cfdfdeddde3c047cefcae199744ffdf82b. Acesso exclusivo do proprietário preservado.
