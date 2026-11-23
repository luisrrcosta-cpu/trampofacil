# Revisão da consulta fiscal — 23/11/2026

Problema: um pedido de nota já registrado permanecia protegido no banco após o cancelamento da contratação, mas a interface removia sua consulta.

Correção:
- Contratações canceladas permitem consultar o registro fiscal já existente.
- Não permitem criar novo pedido de nota.
- O profissional recebe orientação própria ao consultar um pedido do cliente, sem opção de solicitá-lo em nome do cliente.
- Resposta com autoria divergente é recusada; sessão expirada exige novo login e limpa a lista.

Sem migração, alterações de permissões, emissão fiscal ou operações financeiras.
Testes acrescentados: consulta após cancelamento no banco; interface do cliente e profissional; pedido ausente em cancelamento; autoria inválida; expiração de sessão.

## Resultado
- 217 testes aprovados, zero falhas: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45187781735 . Também passaram as verificações financeiras, concorrência e prévia isolada.
- Publicação privada concluída com sucesso; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_c0af811a1bd4819189109cd873436c61, deployment appgdep_6b0444ce5d688191a8bc41689c5a9a6f.
- Fonte de interface c31b66dce8b57866e34bed975842134ad7da51e6; hospedagem 8372ee071c43f44d8146bd24452a6c011ca57f49.
- Site: https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site . Audiência exclusiva do proprietário preservada.
