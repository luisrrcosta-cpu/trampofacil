-- Somente homologação. Funções privilegiadas ficam fora do schema público.
create schema revisao_admin;
revoke all on schema revisao_admin from public,anon,service_role;
grant usage on schema revisao_admin to authenticated;

create function revisao_admin.listar(pagina integer)
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
        'descricao',p.descricao,'tipo_prestador',p.tipo_prestador,'tipo_atividade',p.tipo_atividade)) item
    from public.solicitacoes_analise_profissional a join public.profissionais p on p.usuario_id=a.usuario_id
    where a.estado='aguardando_analise' and not p.publicado and p.usuario_id<>uid
    order by a.criado_em,p.usuario_id limit 51 offset pagina*50
  ) fila;
  return resultado;
end;
$$;

create function revisao_admin.aprovar(alvo uuid,esperado jsonb)
returns bigint language plpgsql security definer set search_path='' as $$
begin
  -- A rotina interna valida revisor, versão, solicitação e autoaprovação sob lock.
  return private.aprovar_perfil_revisado(alvo,esperado);
end;
$$;
revoke all on function revisao_admin.listar(integer),revisao_admin.aprovar(uuid,jsonb) from public,anon,service_role;
grant execute on function revisao_admin.listar(integer),revisao_admin.aprovar(uuid,jsonb) to authenticated;

create function public.listar_perfis_revisao(pagina integer default 0)
returns jsonb language sql security invoker set search_path='' as $$
  select revisao_admin.listar(pagina);
$$;
create function public.aprovar_perfil_administrativo(alvo uuid,esperado jsonb)
returns bigint language sql security invoker set search_path='' as $$
  select revisao_admin.aprovar(alvo,esperado);
$$;
revoke all on function public.listar_perfis_revisao(integer),public.aprovar_perfil_administrativo(uuid,jsonb)
  from public,anon,service_role;
grant execute on function public.listar_perfis_revisao(integer),public.aprovar_perfil_administrativo(uuid,jsonb) to authenticated;
-- Não concede USAGE em private nem SELECT/UPDATE nas tabelas internas.
-- Não publica nenhum perfil durante a migração.
