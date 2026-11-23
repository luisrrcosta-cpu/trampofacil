-- Somente homologação: fila de análise, sem publicar ou verificar documentos.
create table public.solicitacoes_analise_profissional (
  usuario_id uuid primary key default auth.uid() references public.profissionais(usuario_id),
  estado text not null default 'aguardando_analise' check (estado = 'aguardando_analise'),
  criado_em timestamptz not null default now()
);
comment on table public.solicitacoes_analise_profissional is
  'Pedido de análise do perfil atual; não representa aprovação, verificação de identidade ou publicação.';
alter table public.solicitacoes_analise_profissional enable row level security;
revoke all on public.solicitacoes_analise_profissional from public,anon,authenticated,service_role;
grant select (usuario_id,estado,criado_em), insert (usuario_id)
  on public.solicitacoes_analise_profissional to authenticated;
create policy analise_autenticacao on public.solicitacoes_analise_profissional as restrictive
  for all to authenticated
  using ((select auth.uid()) is not null and
    coalesce((select auth.jwt())->>'is_anonymous','false')='false')
  with check ((select auth.uid()) is not null and
    coalesce((select auth.jwt())->>'is_anonymous','false')='false');
create policy analise_titular_leitura on public.solicitacoes_analise_profissional
  for select to authenticated using (usuario_id=(select auth.uid()));
create policy analise_titular_solicita on public.solicitacoes_analise_profissional
  for insert to authenticated with check (
    usuario_id=(select auth.uid()) and exists (
      select 1 from public.profissionais p where p.usuario_id=(select auth.uid())
        and not p.publicado
        and p.tipo_prestador in ('pessoa_fisica','mei','empresa')
        and p.tipo_atividade in ('regular','ocasional')
    )
  );
-- A administração revisa o perfil atual por acesso administrativo autorizado.
-- Não há trigger de publicação, alteração de profissionais ou privilégio de aprovação.
