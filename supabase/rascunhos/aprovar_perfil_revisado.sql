-- RASCUNHO INTERNO. Não aplicar automaticamente.
-- Sem RPC pública, sem SECURITY DEFINER e sem concessão a contas comuns.
create table private.revisores_perfil (
  usuario_id uuid primary key references auth.users(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
alter table private.revisores_perfil enable row level security;
revoke all on private.revisores_perfil from public, anon, authenticated, service_role;

create table private.aprovacoes_perfil (
  id bigint generated always as identity primary key,
  profissional_usuario_id uuid not null references public.profissionais(usuario_id),
  revisor_usuario_id uuid not null references auth.users(id),
  solicitado_em timestamptz not null,
  perfil_analisado jsonb not null check(jsonb_typeof(perfil_analisado)='object'),
  criado_em timestamptz not null default now(),
  check(profissional_usuario_id <> revisor_usuario_id)
);
alter table private.aprovacoes_perfil enable row level security;
revoke all on private.aprovacoes_perfil from public, anon, authenticated, service_role;
revoke all on sequence private.aprovacoes_perfil_id_seq from public, anon, authenticated, service_role;

create function private.aprovar_perfil_revisado(alvo uuid, esperado jsonb)
returns bigint language plpgsql security invoker set search_path = ''
as $$
declare
  revisor uuid := auth.uid();
  perfil public.profissionais%rowtype;
  versao jsonb;
  solicitado timestamptz;
  anterior bigint;
  evento bigint;
begin
  if revisor is null or coalesce(auth.jwt()->>'is_anonymous','false') <> 'false' then
    raise exception 'Revisor autenticado obrigatório' using errcode='42501';
  end if;
  -- O lock impede revogação concorrente de ultrapassar a decisão em andamento.
  perform 1 from private.revisores_perfil r
    where r.usuario_id=revisor and r.ativo for share;
  if not found or revisor=alvo then
    raise exception 'Revisor não autorizado' using errcode='42501';
  end if;
  -- Serializa aprovações e edições do mesmo perfil.
  select * into perfil from public.profissionais p where p.usuario_id=alvo for update;
  if not found then raise exception 'Perfil indisponível' using errcode='22023'; end if;
  select a.criado_em into solicitado from public.solicitacoes_analise_profissional a
    where a.usuario_id=alvo and a.estado='aguardando_analise' for share;
  if not found then raise exception 'Pedido de análise obrigatório' using errcode='22023'; end if;
  if perfil.tipo_prestador is null or perfil.tipo_atividade is null then
    raise exception 'Cadastro incompleto' using errcode='22023';
  end if;
  versao := jsonb_build_object('nome',perfil.nome,'cidade',perfil.cidade,
    'servico',perfil.servico,'descricao',perfil.descricao,
    'tipo_prestador',perfil.tipo_prestador,'tipo_atividade',perfil.tipo_atividade);
  if esperado is null or jsonb_typeof(esperado)<>'object' or esperado is distinct from versao then
    raise exception 'Perfil mudou; revise novamente' using errcode='40001';
  end if;
  select a.id into anterior from private.aprovacoes_perfil a
    where a.profissional_usuario_id=alvo and a.solicitado_em=solicitado
      and a.perfil_analisado=versao order by a.id desc limit 1;
  if perfil.publicado and anterior is not null then return anterior; end if;
  if perfil.publicado then
    raise exception 'Perfil já publicado sem esta decisão' using errcode='22023';
  end if;
  update public.profissionais set publicado=true where usuario_id=alvo;
  insert into private.aprovacoes_perfil
    (profissional_usuario_id,revisor_usuario_id,solicitado_em,perfil_analisado)
    values(alvo,revisor,solicitado,versao) returning id into evento;
  return evento;
end;
$$;
revoke all on function private.aprovar_perfil_revisado(uuid,jsonb)
  from public, anon, authenticated, service_role;
-- Sem revisores iniciais, grants, wrapper público ou alterações em perfis existentes.
