-- Somente homologação. Orientação padronizada; sem publicação automática.
create table private.ajustes_perfil (
  id bigint generated always as identity primary key,
  profissional_usuario_id uuid not null references public.profissionais(usuario_id),
  revisor_usuario_id uuid not null references auth.users(id),
  solicitado_em timestamptz not null,
  motivo text not null check(motivo in ('nome_apresentacao','cidade_atendimento','detalhar_servico')),
  perfil_analisado jsonb not null check(jsonb_typeof(perfil_analisado)='object'),
  criado_em timestamptz not null default now(),
  check(profissional_usuario_id<>revisor_usuario_id)
);
alter table private.ajustes_perfil enable row level security;
revoke all on private.ajustes_perfil from public,anon,authenticated,service_role;
revoke all on sequence private.ajustes_perfil_id_seq from public,anon,authenticated,service_role;

create function revisao_admin.pedir_ajuste(alvo uuid,esperado jsonb,motivo_ajuste text)
returns bigint language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); p public.profissionais%rowtype; versao jsonb; solicitado timestamptz; evento bigint;
begin
  if uid is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false' then
    raise exception 'Revisor autenticado obrigatório' using errcode='42501'; end if;
  perform 1 from private.revisores_perfil r where r.usuario_id=uid and r.ativo for share;
  if not found or uid=alvo then raise exception 'Revisor não autorizado' using errcode='42501'; end if;
  if motivo_ajuste is null or motivo_ajuste not in ('nome_apresentacao','cidade_atendimento','detalhar_servico')
    then raise exception 'Motivo inválido' using errcode='22023'; end if;
  select * into p from public.profissionais where usuario_id=alvo for update;
  if not found or p.publicado then raise exception 'Perfil indisponível para ajuste' using errcode='22023'; end if;
  select a.criado_em into solicitado from public.solicitacoes_analise_profissional a
    where a.usuario_id=alvo and a.estado='aguardando_analise' for share;
  if not found then raise exception 'Pedido de análise obrigatório' using errcode='22023'; end if;
  versao:=jsonb_build_object('nome',p.nome,'cidade',p.cidade,'servico',p.servico,'descricao',p.descricao,
    'tipo_prestador',p.tipo_prestador,'tipo_atividade',p.tipo_atividade);
  if esperado is null or esperado is distinct from versao
    then raise exception 'Perfil mudou; revise novamente' using errcode='40001'; end if;
  select a.id into evento from private.ajustes_perfil a where a.profissional_usuario_id=alvo
    and a.solicitado_em=solicitado and a.perfil_analisado=versao and a.motivo=motivo_ajuste
    order by a.id desc limit 1;
  if evento is not null then return evento; end if;
  insert into private.ajustes_perfil(profissional_usuario_id,revisor_usuario_id,solicitado_em,motivo,perfil_analisado)
    values(alvo,uid,solicitado,motivo_ajuste,versao) returning id into evento;
  return evento;
end;
$$;

create function revisao_admin.minha_orientacao()
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); resultado jsonb;
begin
  if uid is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false'
    then raise exception 'Conta autenticada obrigatória' using errcode='42501'; end if;
  select jsonb_build_array(jsonb_build_object('motivo',a.motivo,'criado_em',a.criado_em,
    'perfil_alterado',a.perfil_analisado is distinct from jsonb_build_object(
      'nome',p.nome,'cidade',p.cidade,'servico',p.servico,'descricao',p.descricao,
      'tipo_prestador',p.tipo_prestador,'tipo_atividade',p.tipo_atividade)))
    into resultado from private.ajustes_perfil a join public.profissionais p on p.usuario_id=a.profissional_usuario_id
    where a.profissional_usuario_id=uid and not p.publicado
    order by a.id desc limit 1;
  return coalesce(resultado,'[]'::jsonb);
end;
$$;

revoke all on function revisao_admin.pedir_ajuste(uuid,jsonb,text),revisao_admin.minha_orientacao()
  from public,anon,service_role;
grant execute on function revisao_admin.pedir_ajuste(uuid,jsonb,text),revisao_admin.minha_orientacao() to authenticated;
create function public.pedir_ajuste_perfil(alvo uuid,esperado jsonb,motivo_ajuste text)
returns bigint language sql security invoker set search_path='' as $$
  select revisao_admin.pedir_ajuste(alvo,esperado,motivo_ajuste);
$$;
create function public.consultar_orientacao_perfil()
returns jsonb language sql security invoker set search_path='' as $$
  select revisao_admin.minha_orientacao();
$$;
revoke all on function public.pedir_ajuste_perfil(uuid,jsonb,text),public.consultar_orientacao_perfil()
  from public,anon,service_role;
grant execute on function public.pedir_ajuste_perfil(uuid,jsonb,text),public.consultar_orientacao_perfil() to authenticated;
-- Consultar não recebe UUID: a orientação é sempre da identidade autenticada.
-- Nenhum grant em private, e-mail, documento, cobrança ou alteração de perfil.
