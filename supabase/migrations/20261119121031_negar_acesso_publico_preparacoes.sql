-- Torna explícito o bloqueio já aplicado por RLS sem políticas permissivas.
-- Não concede acesso ao schema, à tabela ou à função privada.
begin;
create policy preparacoes_sem_acesso_cliente
  on private.preparacoes_pagamento as restrictive for all to anon, authenticated
  using (false) with check (false);
commit;
