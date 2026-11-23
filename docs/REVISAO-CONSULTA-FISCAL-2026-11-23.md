# Revisão da consulta fiscal — 23/11/2026

Problema: um pedido de nota já registrado permanecia protegido no banco após o cancelamento da contratação, mas a interface removia sua consulta.

Correção:
- Contratações canceladas permitem consultar o registro fiscal já existente.
- Não permitem criar novo pedido de nota.
- O profissional recebe orientação própria ao consultar um pedido do cliente, sem opção de solicitá-lo em nome do cliente.
- Resposta com autoria divergente é recusada; sessão expirada exige novo login e limpa a lista.

Sem migração, alterações de permissões, emissão fiscal ou operações financeiras.
Testes acrescentados: consulta após cancelamento no banco; interface do cliente e profissional; pedido ausente em cancelamento; autoria inválida; expiração de sessão.
