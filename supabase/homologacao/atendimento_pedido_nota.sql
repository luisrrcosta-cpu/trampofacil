-- Homologação: confirmação de atendimento, sem emissão de documento fiscal.
create table public.atendimentos_pedido_nota (
  solicitacao_id uuid primary key references public.pedidos_nota_fiscal(solicitacao_id),
  profissional_usuario_id uuid not null default auth.uid() references auth.users(id),
  criado_em timestamptz not null default now()
);
comment on table public.atendimentos_pedido_nota is
  'Confirmação do profissional de que está cuidando do pedido; não significa nota emitida ou pagamento.';
alter table public.atendimentos_pedido_nota enable row level security;
revoke all on public.atendimentos_pedido_nota from public,anon,authenticated,service_role;
grant select(solicitacao_id,profissional_usuario_id,criado_em),insert(solicitacao_id)
  on public.atendimentos_pedido_nota to authenticated;
create policy atendimento_nota_autenticacao on public.atendimentos_pedido_nota as restrictive
  for all to authenticated
  using ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous','false')='false')
  with check ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous','false')='false');
create policy atendimento_nota_partes on public.atendimentos_pedido_nota
  for select to authenticated using(exists(
    select 1 from public.solicitacoes s where s.id=solicitacao_id
      and (select auth.uid()) in(s.cliente_usuario_id,s.profissional_usuario_id)
  ));
create policy atendimento_nota_profissional on public.atendimentos_pedido_nota
  for insert to authenticated with check (
    profissional_usuario_id=(select auth.uid()) and exists(
      select 1 from public.pedidos_nota_fiscal n join public.solicitacoes s on s.id=n.solicitacao_id
      where n.solicitacao_id=atendimentos_pedido_nota.solicitacao_id
        and s.profissional_usuario_id=(select auth.uid())
    )
  );
-- Sem UPDATE/DELETE, campos livres, arquivos, status de emissão ou SECURITY DEFINER.
