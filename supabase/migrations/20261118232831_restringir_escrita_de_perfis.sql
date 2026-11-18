begin;

-- Preserve as políticas de titularidade e limite as colunas graváveis pela API.
revoke insert, update on public.clientes, public.profissionais from authenticated;

grant insert (usuario_id, nome, email, telefone, cidade),
      update (usuario_id, nome, email, telefone, cidade)
  on public.clientes to authenticated;

grant insert (usuario_id, nome, cidade, servico, descricao, telefone),
      update (usuario_id, nome, cidade, servico, descricao, telefone)
  on public.profissionais to authenticated;

-- usuario_id integra o upsert. A política de titularidade impede sua troca.
create policy clientes_autenticacao_e_email
  on public.clientes as restrictive for all to authenticated
  using (coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') = 'false')
  with check (
    coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') = 'false'
    and lower(email) = lower((select auth.jwt() ->> 'email'))
  );

create policy profissionais_autenticacao
  on public.profissionais as restrictive for all to authenticated
  using (coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') = 'false')
  with check (coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') = 'false');

commit;
