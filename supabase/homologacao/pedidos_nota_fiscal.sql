-- Homologação: solicitação de nota, sem emissão, anexos ou dados fiscais.
create table public.pedidos_nota_fiscal (
  solicitacao_id uuid primary key references public.solicitacoes(id),
  solicitante_usuario_id uuid not null default auth.uid() references auth.users(id),
  estado text not null default 'solicitada' check (estado = 'solicitada'),
  criado_em timestamptz not null default now()
);
comment on table public.pedidos_nota_fiscal is
  'Pedido ao prestador, sem emissão automática e sem documentos. Ausência de linha significa não solicitada.';
alter table public.pedidos_nota_fiscal enable row level security;
revoke all on public.pedidos_nota_fiscal from public, anon, authenticated, service_role;
grant select (solicitacao_id, solicitante_usuario_id, estado, criado_em)
  on public.pedidos_nota_fiscal to authenticated;
grant insert (solicitacao_id) on public.pedidos_nota_fiscal to authenticated;

create policy nota_autenticacao on public.pedidos_nota_fiscal as restrictive
  for all to authenticated
  using ((select auth.uid()) is not null and
    coalesce((select auth.jwt())->>'is_anonymous','false') = 'false')
  with check ((select auth.uid()) is not null and
    coalesce((select auth.jwt())->>'is_anonymous','false') = 'false');
create policy nota_participantes_leitura on public.pedidos_nota_fiscal
  for select to authenticated using (exists (
    select 1 from public.solicitacoes s
    where s.id = solicitacao_id
      and (select auth.uid()) in (s.cliente_usuario_id,s.profissional_usuario_id)
  ));
create policy nota_cliente_solicita on public.pedidos_nota_fiscal
  for insert to authenticated with check (
    solicitante_usuario_id = (select auth.uid()) and exists (
      select 1 from public.solicitacoes s
      where s.id = solicitacao_id and s.cliente_usuario_id = (select auth.uid())
        and s.status in ('aceita','em_andamento','entregue','concluida')
    )
  );
-- Sem UPDATE/DELETE, SECURITY DEFINER, emissão fiscal ou operações financeiras.
