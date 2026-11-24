# Concorrência da recusa administrativa — 24/11/2026

Commit de testes: `53885bc13c1bac989228aeb71648317d965625f4`.
Execução PostgreSQL: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45512634928 — aprovada.

O script scripts/testar-concorrencia-revisao-pg.mjs agora prova espera real por lock entre duas conexões em oito cenários. Além dos quatro anteriores:
- Duas recusas da mesma versão e motivo retornam o mesmo evento; somente um registro é criado.
- Edição adquirindo o lock primeiro invalida a recusa antiga com SQLSTATE 40001.
- Aprovação primeiro impede recusa do perfil publicado (22023).
- Recusa primeiro permite aprovação posterior, mantendo o histórico e publicando a versão analisada.

Banco PostgreSQL 17.12 descartável, limitado por código a loopback e ao nome de banco de teste. Nenhum Supabase foi acessado pelo teste. A pausa do profissional e as proteções existentes permanecem.

## Publicação anterior confirmada
A entrega da recusa está disponível no site privado:
https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site
Publicação confirmada como succeeded/ready, versão opaca
`appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_01b0a3833ed48191b83554f6d2062f86`.
Esta entrega acrescenta testes e documentação; não precisa republicar a interface.

Suíte geral e interface aprovadas: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45512634585 . Regressões financeiras aprovadas: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45512634757 .
