-- Apenas homologação. Registro de atendimento; não executa bloqueio bancário ou estorno.
create table public.reclamacoes_servico (
  solicitacao_id uuid primary key references public.solicitacoes(id),
  cliente_usuario_id uuid not null default auth.uid() references auth.users(id),
  motivo text not null check (motivo in ('servico_nao_realizado','qualidade','divergencia_combinado','cobranca','outro')),
  descricao text not null check (char_length(btrim(descricao)) >= 10 and char_length(descricao) <= 2000),
  criado_em timestamptz not null default now()
);
create table public.respostas_reclamacao (
  solicitacao_id uuid primary key references public.reclamacoes_servico(solicitacao_id),
  profissional_usuario_id uuid not null default auth.uid() references auth.users(id),
  descricao text not null check (char_length(btrim(descricao)) >= 10 and char_length(descricao) <= 2000),
  criado_em timestamptz not null default now()
);
alter table public.reclamacoes_servico enable row level security;
alter table public.respostas_reclamacao enable row level security;
revoke all on public.reclamacoes_servico,public.respostas_reclamacao from public,anon,authenticated,service_role;
grant select on public.reclamacoes_servico,public.respostas_reclamacao to authenticated;
grant insert(solicitacao_id,motivo,descricao) on public.reclamacoes_servico to authenticated;
grant insert(solicitacao_id,descricao) on public.respostas_reclamacao to authenticated;
create policy reclamacao_identificada on public.reclamacoes_servico as restrictive for all to authenticated
  using ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous','false')='false')
  with check ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous','false')='false');
create policy resposta_reclamacao_identificada on public.respostas_reclamacao as restrictive for all to authenticated
  using ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous','false')='false')
  with check ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous','false')='false');
create policy reclamacao_partes on public.reclamacoes_servico for select to authenticated using(exists(
  select 1 from public.solicitacoes s where s.id=reclamacoes_servico.solicitacao_id
    and (select auth.uid()) in(s.cliente_usuario_id,s.profissional_usuario_id)
));
create policy reclamacao_cliente on public.reclamacoes_servico for insert to authenticated with check(
  cliente_usuario_id=(select auth.uid()) and exists(
    select 1 from public.solicitacoes s where s.id=reclamacoes_servico.solicitacao_id
      and s.cliente_usuario_id=(select auth.uid()) and s.cliente_usuario_id<>s.profissional_usuario_id
  )
);
create policy resposta_reclamacao_partes on public.respostas_reclamacao for select to authenticated using(exists(
  select 1 from public.solicitacoes s where s.id=respostas_reclamacao.solicitacao_id
    and (select auth.uid()) in(s.cliente_usuario_id,s.profissional_usuario_id)
));
create policy resposta_reclamacao_profissional on public.respostas_reclamacao for insert to authenticated with check(
  profissional_usuario_id=(select auth.uid()) and exists(
    select 1 from public.reclamacoes_servico r join public.solicitacoes s on s.id=r.solicitacao_id
    where r.solicitacao_id=respostas_reclamacao.solicitacao_id and s.profissional_usuario_id=(select auth.uid())
      and s.cliente_usuario_id<>s.profissional_usuario_id
  )
);
comment on table public.reclamacoes_servico is 'Registro inicial privado para análise. Não executa estorno, custódia, decisão ou alteração do pedido.';
comment on table public.respostas_reclamacao is 'Resposta inicial do profissional. Não representa resolução ou reconhecimento automático de responsabilidade.';

-- Consulta administrativa usa os revisores já autorizados, sem novos usuários/grants em private.
create function revisao_admin.listar_reclamacoes(pagina integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); resultado jsonb;
begin
  if uid is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false' then
    raise exception 'Área restrita' using errcode='42501';
  end if;
  perform 1 from private.revisores_perfil r where r.usuario_id=uid and r.ativo for share;
  if not found then raise exception 'Área restrita' using errcode='42501'; end if;
  if pagina is null or pagina<0 or pagina>10000 then
    raise exception 'Página inválida' using errcode='22023';
  end if;
  select coalesce(jsonb_agg(item order by criado_em,solicitacao_id),'[]'::jsonb) into resultado
  from (
    select r.criado_em,r.solicitacao_id,jsonb_build_object(
      'solicitacao_id',r.solicitacao_id,'titulo',s.titulo,'motivo',r.motivo,
      'descricao',r.descricao,'criado_em',r.criado_em,
      'resposta',case when p.solicitacao_id is null then null else jsonb_build_object('descricao',p.descricao,'criado_em',p.criado_em) end
    ) item
    from public.reclamacoes_servico r join public.solicitacoes s on s.id=r.solicitacao_id
    left join public.respostas_reclamacao p on p.solicitacao_id=r.solicitacao_id
    where uid not in(s.cliente_usuario_id,s.profissional_usuario_id)
    order by r.criado_em,r.solicitacao_id limit 51 offset pagina*50
  ) fila;
  return resultado;
end;
$$;
revoke all on function revisao_admin.listar_reclamacoes(integer) from public,anon,service_role;
grant execute on function revisao_admin.listar_reclamacoes(integer) to authenticated;
create function public.listar_reclamacoes_administrativas(pagina integer default 0)
returns jsonb language sql security invoker set search_path='' as $$
  select revisao_admin.listar_reclamacoes(pagina);
$$;
revoke all on function public.listar_reclamacoes_administrativas(integer) from public,anon,service_role;
grant execute on function public.listar_reclamacoes_administrativas(integer) to authenticated;
-- Nenhuma política de UPDATE/DELETE, decisão financeira, prazo de garantia ou retenção automática.
