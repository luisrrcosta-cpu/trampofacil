-- Somente homologação. Campos na mesma linha serializam edição/revisão sob o lock existente.
alter table public.profissionais add column especialidades text[] not null default '{}';
alter table public.catalogo_profissionais add column especialidades text[] not null default '{}';

create function private.validar_especialidades_profissional() returns trigger
language plpgsql security invoker set search_path='' as $$
declare item text; chave text; lista text[]:='{}'; chaves text[]:='{}';
begin
 if new.especialidades is null or cardinality(new.especialidades)>10 or coalesce(array_ndims(new.especialidades),1)<>1 then
 raise exception 'Informe até dez especialidades' using errcode='22023';end if;
 foreach item in array new.especialidades loop
  if item is null or char_length(btrim(item)) not between 2 and 120 or item ~ '[[:cntrl:]]' then
  raise exception 'Especialidade inválida' using errcode='22023';end if;
  item:=normalize(btrim(item),NFC);
  if char_length(item) not between 2 and 120 then raise exception 'Especialidade inválida' using errcode='22023';end if;
  chave:=lower(item);
  if chave=any(chaves) or chave=lower(normalize(btrim(new.servico),NFC)) then
  raise exception 'Especialidade repetida' using errcode='22023';end if;
  lista:=array_append(lista,item);chaves:=array_append(chaves,chave);
 end loop;
 new.especialidades:=lista;return new;
end;$$;
revoke all on function private.validar_especialidades_profissional() from public,anon,authenticated,service_role;
create trigger normalizar_especialidades before insert or update on public.profissionais
for each row execute function private.validar_especialidades_profissional();

create function private.versao_perfil_especialidades(p public.profissionais) returns jsonb
language sql immutable security invoker set search_path='' as $$
 select jsonb_build_object('nome',p.nome,'cidade',p.cidade,'servico',p.servico,'descricao',p.descricao,
 'tipo_prestador',p.tipo_prestador,'tipo_atividade',p.tipo_atividade)
 || case when cardinality(p.especialidades)=0 then '{}'::jsonb else jsonb_build_object('especialidades',p.especialidades) end;
$$;
revoke all on function private.versao_perfil_especialidades(public.profissionais) from public,anon,authenticated,service_role;
grant select(especialidades),insert(especialidades),update(especialidades) on public.profissionais to authenticated;
grant select(especialidades) on public.catalogo_profissionais to anon,authenticated;

CREATE OR REPLACE FUNCTION private.aprovar_perfil_revisado(alvo uuid, esperado jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
  versao := private.versao_perfil_especialidades(perfil);
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
$function$;

CREATE OR REPLACE FUNCTION private.reavaliar_publicacao_profissional()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if old.publicado and row(new.nome,new.cidade,new.servico,new.descricao,new.tipo_prestador,new.tipo_atividade,new.especialidades)
      is distinct from row(old.nome,old.cidade,old.servico,old.descricao,old.tipo_prestador,old.tipo_atividade,old.especialidades) then
    new.publicado := false;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION private.sincronizar_catalogo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
 INSERT INTO public.catalogo_profissionais(id,nome,cidade,servico,descricao,ativo,especialidades)
 VALUES(NEW.id,NEW.nome,NEW.cidade,NEW.servico,NEW.descricao,(NEW.publicado AND NOT NEW.pausado),NEW.especialidades)
 ON CONFLICT(id) DO UPDATE SET nome=EXCLUDED.nome,cidade=EXCLUDED.cidade,servico=EXCLUDED.servico,descricao=EXCLUDED.descricao,ativo=EXCLUDED.ativo,especialidades=EXCLUDED.especialidades;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.buscar_profissionais(termo_servico text DEFAULT ''::text, termo_cidade text DEFAULT ''::text, pagina integer DEFAULT 0)
 RETURNS TABLE(id uuid, nome text, cidade text, servico text, descricao text)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select c.id,c.nome,c.cidade,c.servico,c.descricao
  from public.catalogo_profissionais c
  where c.ativo
    and coalesce(pagina,0) <= 10000
    and (pg_catalog.strpos(pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.translate(pg_catalog.lower(pg_catalog.normalize(c.servico, 'NFC')), 'áàâãäéèêëíìîïóòôõöúùûüç ', 'aaaaaeeeeiiiiooooouuuuc '), '[[:space:]]+', ' ', 'g')), pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.translate(pg_catalog.lower(pg_catalog.normalize(pg_catalog.left(pg_catalog.btrim(termo_servico),120), 'NFC')), 'áàâãäéèêëíìîïóòôõöúùûüç ', 'aaaaaeeeeiiiiooooouuuuc '), '[[:space:]]+', ' ', 'g'))) > 0 or exists(select 1 from unnest(c.especialidades) e(servico) where pg_catalog.strpos(pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.translate(pg_catalog.lower(pg_catalog.normalize(e.servico, 'NFC')), 'áàâãäéèêëíìîïóòôõöúùûüç ', 'aaaaaeeeeiiiiooooouuuuc '), '[[:space:]]+', ' ', 'g')), pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.translate(pg_catalog.lower(pg_catalog.normalize(pg_catalog.left(pg_catalog.btrim(termo_servico),120), 'NFC')), 'áàâãäéèêëíìîïóòôõöúùûüç ', 'aaaaaeeeeiiiiooooouuuuc '), '[[:space:]]+', ' ', 'g'))) > 0))
    and pg_catalog.strpos(pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.translate(pg_catalog.lower(pg_catalog.normalize(c.cidade, 'NFC')), 'áàâãäéèêëíìîïóòôõöúùûüç ', 'aaaaaeeeeiiiiooooouuuuc '), '[[:space:]]+', ' ', 'g')), pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.translate(pg_catalog.lower(pg_catalog.normalize(pg_catalog.left(pg_catalog.btrim(termo_cidade),120), 'NFC')), 'áàâãäéèêëíìîïóòôõöúùûüç ', 'aaaaaeeeeiiiiooooouuuuc '), '[[:space:]]+', ' ', 'g'))) > 0
  order by pg_catalog.lower(c.nome),c.id
  limit 20 offset least(greatest(pagina,0),10000)::bigint * 20
$function$;

CREATE OR REPLACE FUNCTION revisao_admin.listar(pagina integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
        'perfil',private.versao_perfil_especialidades(p),
        'recusa',(select jsonb_build_object('motivo',r.motivo,'criado_em',r.criado_em,
          'perfil_alterado',r.perfil_analisado is distinct from private.versao_perfil_especialidades(p))
          from private.recusas_publicacao_perfil r where r.profissional_usuario_id=p.usuario_id
          order by r.id desc limit 1)) item
    from public.solicitacoes_analise_profissional a join public.profissionais p on p.usuario_id=a.usuario_id
    where a.estado='aguardando_analise' and not p.publicado and p.usuario_id<>uid
    order by a.criado_em,p.usuario_id limit 51 offset pagina*50
  ) fila;
  return resultado;
end;
$function$;

CREATE OR REPLACE FUNCTION revisao_admin.minha_orientacao()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid:=auth.uid(); resultado jsonb;
begin
  if uid is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false'
    then raise exception 'Conta autenticada obrigatória' using errcode='42501'; end if;
  select jsonb_build_array(jsonb_build_object('motivo',a.motivo,'criado_em',a.criado_em,
    'perfil_alterado',a.perfil_analisado is distinct from private.versao_perfil_especialidades(p)))
    into resultado from private.ajustes_perfil a join public.profissionais p on p.usuario_id=a.profissional_usuario_id
    where a.profissional_usuario_id=uid and not p.publicado
    order by a.id desc limit 1;
  return coalesce(resultado,'[]'::jsonb);
end;
$function$;

CREATE OR REPLACE FUNCTION revisao_admin.minha_recusa()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid:=auth.uid(); resultado jsonb;
begin
  if uid is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false'
    then raise exception 'Conta autenticada obrigatória' using errcode='42501'; end if;
  select jsonb_build_array(jsonb_build_object('motivo',a.motivo,'criado_em',a.criado_em,
    'perfil_alterado',a.perfil_analisado is distinct from private.versao_perfil_especialidades(p)))
    into resultado from private.recusas_publicacao_perfil a join public.profissionais p on p.usuario_id=a.profissional_usuario_id
    where a.profissional_usuario_id=uid and not p.publicado
    order by a.id desc limit 1;
  return coalesce(resultado,'[]'::jsonb);
end;
$function$;

CREATE OR REPLACE FUNCTION revisao_admin.pedir_ajuste(alvo uuid, esperado jsonb, motivo_ajuste text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  versao:=private.versao_perfil_especialidades(p);
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
$function$;

CREATE OR REPLACE FUNCTION revisao_admin.recusar_publicacao(alvo uuid, esperado jsonb, motivo_recusa text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  versao:=private.versao_perfil_especialidades(p);
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
$function$;

