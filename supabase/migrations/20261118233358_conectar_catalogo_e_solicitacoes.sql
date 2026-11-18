begin;

create function public.buscar_profissionais(
  termo_servico text default '',
  termo_cidade text default '',
  pagina integer default 0
)
returns table (id uuid, nome text, cidade text, servico text, descricao text)
language sql stable security invoker
set search_path = ''
as $$
  select c.id, c.nome, c.cidade, c.servico, c.descricao
  from public.catalogo_profissionais c
  where c.ativo
    and pg_catalog.strpos(lower(c.servico), lower(left(btrim(termo_servico), 120))) > 0
    and pg_catalog.strpos(lower(c.cidade), lower(left(btrim(termo_cidade), 120))) > 0
  order by lower(c.nome), c.id
  limit 20 offset greatest(pagina, 0)::bigint * 20
$$;

revoke execute on function public.buscar_profissionais(text, text, integer) from public;
grant execute on function public.buscar_profissionais(text, text, integer) to anon, authenticated;

-- Os triggers privados existentes validam as transições e registram o histórico.
-- A chave criada pelo navegador permite identificar uma tentativa repetida.
grant insert (id) on public.solicitacoes to authenticated;

create policy solicitacoes_sessao_identificada
  on public.solicitacoes as restrictive for all to authenticated
  using (coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') = 'false')
  with check (coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') = 'false');

commit;
