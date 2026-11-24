-- Somente homologação: recusa da publicação pendente, com motivo e versão.
-- Não bloqueia conta, não apaga perfil e não altera contratos ou pagamentos.
create table private.recusas_publicacao_perfil (
  id bigint generated always as identity primary key,
  profissional_usuario_id uuid not null references public.profissionais(usuario_id),
  revisor_usuario_id uuid not null references auth.users(id),
  solicitado_em timestamptz not null,
  motivo text not null check(motivo in ('informacoes_inconsistentes','apresentacao_inadequada','servico_nao_identificavel')),
  perfil_analisado jsonb not null check(jsonb_typeof(perfil_analisado)='object'),
  criado_em timestamptz not null default now(),
  check(profissional_usuario_id<>revisor_usuario_id)
);
alter table private.recusas_publicacao_perfil enable row level security;
revoke all on private.recusas_publicacao_perfil from public,anon,authenticated,service_role;
revoke all on sequence private.recusas_publicacao_perfil_id_seq from public,anon,authenticated,service_role;

create function revisao_admin.recusar_publicacao(alvo uuid,esperado jsonb,motivo_recusa text)
returns bigint language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); p public.profissionais%rowtype; versao jsonb; solicitado timestamptz; evento bigint;
begin
  if uid is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false' then
    raise exception 'Revisor autenticado obrigatório' using errcode='42501'; end if;
  perform 1 from private.revisores_perfil r where r.usuario_id=uid and r.ativo for share;
  if not found or uid=alvo then raise exception 'Revisor não autorizado' using errcode='42501'; end if;
  if motivo_recusa is null or motivo_recusa not in ('informacoes_inconsistentes','apresentacao_inadequada','servico_nao_identificavel')
    then raise exception 'Motivo inválido' using errcode='22023'; end if;
  select * into p from public.profissionais where usuario_id=alvo for update;
  if not found or p.publicado then raise exception 'Perfil indisponível para recusa' using errcode='22023'; end if;
  select a.criado_em into solicitado from public.solicitacoes_analise_profissional a
    where a.usuario_id=alvo and a.estado='aguardando_analise' for share;
  if not found then raise exception 'Pedido de análise obrigatório' using errcode='22023'; end if;
  versao:=jsonb_build_object('nome',p.nome,'cidade',p.cidade,'servico',p.servico,'descricao',p.descricao,
    'tipo_prestador',p.tipo_prestador,'tipo_atividade',p.tipo_atividade);
  if esperado is null or esperado is distinct from versao
    then raise exception 'Perfil mudou; revise novamente' using errcode='40001'; end if;
  select a.id into evento from private.recusas_publicacao_perfil a where a.profissional_usuario_id=alvo
    and a.solicitado_em=solicitado and a.perfil_analisado=versao and a.motivo=motivo_recusa
    and a.id=(select max(ultima.id) from private.recusas_publicacao_perfil ultima
      where ultima.profissional_usuario_id=alvo and ultima.solicitado_em=solicitado)
    order by a.id desc limit 1;
  if evento is not null then return evento; end if;
  insert into private.recusas_publicacao_perfil(profissional_usuario_id,revisor_usuario_id,solicitado_em,motivo,perfil_analisado)
    values(alvo,uid,solicitado,motivo_recusa,versao) returning id into evento;
  return evento;
end;
$$;

create function revisao_admin.minha_recusa()
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); resultado jsonb;
begin
  if uid is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false'
    then raise exception 'Conta autenticada obrigatória' using errcode='42501'; end if;
  select jsonb_build_array(jsonb_build_object('motivo',a.motivo,'criado_em',a.criado_em,
    'perfil_alterado',a.perfil_analisado is distinct from jsonb_build_object(
      'nome',p.nome,'cidade',p.cidade,'servico',p.servico,'descricao',p.descricao,
      'tipo_prestador',p.tipo_prestador,'tipo_atividade',p.tipo_atividade)))
    into resultado from private.recusas_publicacao_perfil a join public.profissionais p on p.usuario_id=a.profissional_usuario_id
    where a.profissional_usuario_id=uid and not p.publicado
    order by a.id desc limit 1;
  return coalesce(resultado,'[]'::jsonb);
end;
$$;

revoke all on function revisao_admin.recusar_publicacao(uuid,jsonb,text),revisao_admin.minha_recusa()
  from public,anon,service_role;
grant execute on function revisao_admin.recusar_publicacao(uuid,jsonb,text),revisao_admin.minha_recusa() to authenticated;
create function public.recusar_publicacao_perfil(alvo uuid,esperado jsonb,motivo_recusa text)
returns bigint language sql security invoker set search_path='' as $$
  select revisao_admin.recusar_publicacao(alvo,esperado,motivo_recusa);
$$;
create function public.consultar_recusa_publicacao()
returns jsonb language sql security invoker set search_path='' as $$
  select revisao_admin.minha_recusa();
$$;
revoke all on function public.recusar_publicacao_perfil(uuid,jsonb,text),public.consultar_recusa_publicacao()
  from public,anon,service_role;
grant execute on function public.recusar_publicacao_perfil(uuid,jsonb,text),public.consultar_recusa_publicacao() to authenticated;
-- Consultar não recebe UUID: a orientação é sempre da identidade autenticada.
-- Nenhum grant em private, e-mail, documento, cobrança ou alteração de perfil.

-- A fila continua disponível para reconsideração, com a última recusa indicada.
create or replace function revisao_admin.listar(pagina integer)
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
  select coalesce(jsonb_agg(item order by solicitado_em,usuario_id),'[]'::jsonb) into resultado
  from (
    select a.criado_em solicitado_em,p.usuario_id,
      jsonb_build_object('usuario_id',p.usuario_id,'solicitado_em',a.criado_em,
        'perfil',jsonb_build_object('nome',p.nome,'cidade',p.cidade,'servico',p.servico,
        'descricao',p.descricao,'tipo_prestador',p.tipo_prestador,'tipo_atividade',p.tipo_atividade),
        'recusa',(select jsonb_build_object('motivo',r.motivo,'criado_em',r.criado_em,
          'perfil_alterado',r.perfil_analisado is distinct from jsonb_build_object(
            'nome',p.nome,'cidade',p.cidade,'servico',p.servico,'descricao',p.descricao,
            'tipo_prestador',p.tipo_prestador,'tipo_atividade',p.tipo_atividade))
          from private.recusas_publicacao_perfil r where r.profissional_usuario_id=p.usuario_id
          order by r.id desc limit 1)) item
    from public.solicitacoes_analise_profissional a join public.profissionais p on p.usuario_id=a.usuario_id
    where a.estado='aguardando_analise' and not p.publicado and p.usuario_id<>uid
    order by a.criado_em,p.usuario_id limit 51 offset pagina*50
  ) fila;
  return resultado;
end;
$$;
