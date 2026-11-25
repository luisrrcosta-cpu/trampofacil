-- Somente homologação: avaliação privada pelas partes do serviço concluído.
create table public.avaliacoes_servico (
 solicitacao_id uuid primary key references public.solicitacoes(id),
 cliente_usuario_id uuid not null default auth.uid() references auth.users(id),
 nota smallint not null check(nota between 1 and 5),
 criado_em timestamptz not null default now()
);
comment on table public.avaliacoes_servico is 'Nota privada do cliente após conclusão; não publica reputação nem altera contrato ou pagamento.';
alter table public.avaliacoes_servico enable row level security;
revoke all on public.avaliacoes_servico from public,anon,authenticated,service_role;
grant select(solicitacao_id,cliente_usuario_id,nota,criado_em),insert(solicitacao_id,nota)
 on public.avaliacoes_servico to authenticated;
create index avaliacoes_servico_cliente_idx on public.avaliacoes_servico(cliente_usuario_id);
create policy avaliacao_autenticacao on public.avaliacoes_servico as restrictive
 for all to authenticated
 using ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous','false')='false')
 with check ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous','false')='false');
create policy avaliacao_partes on public.avaliacoes_servico for select to authenticated
 using (exists(select 1 from public.solicitacoes s where s.id=solicitacao_id
  and (select auth.uid()) in(s.cliente_usuario_id,s.profissional_usuario_id)));
create policy avaliacao_cliente_concluida on public.avaliacoes_servico for insert to authenticated
 with check(cliente_usuario_id=(select auth.uid()) and exists(
  select 1 from public.solicitacoes s where s.id=solicitacao_id and s.status='concluida'
   and s.cliente_usuario_id=(select auth.uid()) and s.cliente_usuario_id<>s.profissional_usuario_id
 ));
-- Sem UPDATE/DELETE, comentário livre, agregação pública ou SECURITY DEFINER.
