# Resumo atual na conversa — 23/11/2026

A conversa passa a exibir a situação atual da contratação e o orçamento atual retornados pela API autenticada. Atualizar histórico e mensagens também atualiza esse resumo, mantendo o rascunho em memória.

O histórico continua separado: eventos antigos não são apresentados como valor atual. A tela não aceita orçamento, altera contratação ou confirma pagamento.

O resumo é limpo ao iniciar nova leitura ou trocar de sessão e só aparece após validação da contratação, histórico e mensagens. Valores negativos, fracionários ou fora dos limites são recusados; falhas não deixam um resumo anterior visível como se estivesse atualizado.

Sem migrações, permissões novas, envio automático, pagamentos ou produção. Teste de navegador cobre alteração de valor/situação, preservação de texto, resposta inválida, ocultação segura e limpeza na troca de sessão.

## Resultado confirmado
- 223 testes aprovados, zero falhas: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45203998519 . Verificações financeiras, concorrência e prévia isolada passaram.
- Contrato de regressão atualizado para exigir valor_centavos na leitura autenticada da contratação, preservando os demais campos de autorização.
- Publicação privada concluída: versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_99c3d46b8e108191bd2e8961bfee4b8e; deployment appgdep_6b0459deb78c8191b188403daf5f4239.
- Fonte da interface fa65518290bf5a53ed49e5b0867462d4284ac67b; hospedagem f245cd44963657771e40c584f4bc301768319acc. Acesso exclusivo do proprietário preservado.
