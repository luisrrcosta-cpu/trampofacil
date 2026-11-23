# Resumo atual na conversa — 23/11/2026

A conversa passa a exibir a situação atual da contratação e o orçamento atual retornados pela API autenticada. Atualizar histórico e mensagens também atualiza esse resumo, mantendo o rascunho em memória.

O histórico continua separado: eventos antigos não são apresentados como valor atual. A tela não aceita orçamento, altera contratação ou confirma pagamento.

O resumo é limpo ao iniciar nova leitura ou trocar de sessão e só aparece após validação da contratação, histórico e mensagens. Valores negativos, fracionários ou fora dos limites são recusados; falhas não deixam um resumo anterior visível como se estivesse atualizado.

Sem migrações, permissões novas, envio automático, pagamentos ou produção. Teste de navegador cobre alteração de valor/situação, preservação de texto, resposta inválida, ocultação segura e limpeza na troca de sessão.
