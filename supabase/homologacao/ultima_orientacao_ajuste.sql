-- Homologação: só a última orientação pode ser reutilizada como repetição.
-- Preserva privilégios, assinatura, locks e checks da função existente.
create or replace function revisao_admin.pedir_ajuste(alvo uuid,esperado jsonb,motivo_ajuste text)
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
    and a.id=(select max(ultima.id) from private.ajustes_perfil ultima
      where ultima.profissional_usuario_id=alvo and ultima.solicitado_em=solicitado)
    order by a.id desc limit 1;
  if evento is not null then return evento; end if;
  insert into private.ajustes_perfil(profissional_usuario_id,revisor_usuario_id,solicitado_em,motivo,perfil_analisado)
    values(alvo,uid,solicitado,motivo_ajuste,versao) returning id into evento;
  return evento;
end;
$$;
