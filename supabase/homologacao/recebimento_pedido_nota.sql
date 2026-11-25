-- Homologação: confirmação de recebimento, sem emissão de documento fiscal.
create table public.recebimentos_pedido_nota (
  solicitacao_id uuid primary key references public.entregas_pedido_nota(solicitacao_id),
  cliente_usuario_id uuid not null default auth.uid() references auth.users(id),
  criado_em timestamptz not null default now()
);
comment on table public.recebimentos_pedido_nota is
  'Confirmação do cliente de recebimento por canal combinado; não comprova emissão nem validade fiscal.';
alter table public.recebimentos_pedido_nota enable row level security;
revoke all on public.recebimentos_pedido_nota from public,anon,authenticated,service_role;
grant select(solicitacao_id,cliente_usuario_id,criado_em),insert(solicitacao_id)
  on public.recebimentos_pedido_nota to authenticated;
create policy recebimento_nota_autenticacao on public.recebimentos_pedido_nota as restrictive
  for all to authenticated
  using ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous','false')='false')
  with check ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous','false')='false');
create policy recebimento_nota_partes on public.recebimentos_pedido_nota
  for select to authenticated using(exists(
    select 1 from public.solicitacoes s where s.id=solicitacao_id
      and (select auth.uid()) in(s.cliente_usuario_id,s.profissional_usuario_id)
  ));
create policy recebimento_nota_cliente on public.recebimentos_pedido_nota
  for insert to authenticated with check (
    cliente_usuario_id=(select auth.uid()) and exists(
      select 1 from public.entregas_pedido_nota n join public.solicitacoes s on s.id=n.solicitacao_id
      where n.solicitacao_id=recebimentos_pedido_nota.solicitacao_id
        and s.cliente_usuario_id=(select auth.uid())
    )
  );
-- Sem UPDATE/DELETE, campos livres, arquivos, status de emissão ou SECURITY DEFINER.
