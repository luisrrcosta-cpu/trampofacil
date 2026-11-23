-- Executar somente em asdszqtpydiowgerxwee; NÃO envia OTP/e-mail.
-- Papéis reais PostgreSQL com claims simuladas, sem login HTTP real.
-- Identidades e perfis fictícios; sempre ROLLBACK. Nenhum registro existente é aprovado.
begin;
do $teste$
declare
  revisor uuid:=gen_random_uuid(); pro uuid:=gen_random_uuid(); terceiro uuid:=gen_random_uuid();
  pid uuid; esperado jsonb; atual jsonb; evento bigint; repetido bigint; fila jsonb; n bigint;
begin
  insert into auth.users(id,email,aud,role,email_confirmed_at) values
    (revisor,'qa-'||revisor||'@example.invalid','authenticated','authenticated',now()),
    (pro,'qa-'||pro||'@example.invalid','authenticated','authenticated',now()),
    (terceiro,'qa-'||terceiro||'@example.invalid','authenticated','authenticated',now());
  insert into private.revisores_perfil(usuario_id) values(revisor);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',pro,'is_anonymous',false,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',pro::text,true);
  execute 'set local role authenticated';
  insert into public.profissionais(usuario_id,nome,cidade,servico,descricao,telefone,tipo_prestador,tipo_atividade)
    values(pro,'QA Perfil de revisão','Cidade fictícia','Costura fictícia','Descrição inicial','11999999999','pessoa_fisica','ocasional');
  update public.profissionais set pausado=true where usuario_id=pro;
  select id into strict pid from public.profissionais where usuario_id=pro;
  insert into public.solicitacoes_analise_profissional(usuario_id) values(pro);
  begin perform public.listar_perfis_revisao(0);raise exception 'FAIL: titular lê fila';exception when insufficient_privilege then null;end;
  execute 'reset role';
  select jsonb_build_object('nome',nome,'cidade',cidade,'servico',servico,'descricao',descricao,
    'tipo_prestador',tipo_prestador,'tipo_atividade',tipo_atividade)
    into esperado from public.profissionais where usuario_id=pro;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',revisor,'is_anonymous',false,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',revisor::text,true);
  execute 'set local role authenticated';
  fila:=public.listar_perfis_revisao(0);
  if not exists(select 1 from jsonb_array_elements(fila) x where x->>'usuario_id'=pro::text and x->'perfil'=esperado)
    then raise exception 'FAIL: perfil não aparece na fila';end if;
  begin perform public.aprovar_perfil_administrativo(revisor,'{}'::jsonb);raise exception 'FAIL: autoaprovação';exception when insufficient_privilege then null;end;
  begin perform 1 from private.revisores_perfil;raise exception 'FAIL: acesso direto privado';exception when insufficient_privilege then null;end;
  evento:=public.aprovar_perfil_administrativo(pro,esperado);
  repetido:=public.aprovar_perfil_administrativo(pro,esperado);
  if evento is null or repetido<>evento then raise exception 'FAIL: repetição duplicou aprovação';end if;
  execute 'reset role';
  if not exists(select 1 from public.profissionais where usuario_id=pro and publicado and pausado)
    then raise exception 'FAIL: aprovação alterou pausa';end if;
  if exists(select 1 from public.catalogo_profissionais where id=pid and ativo)
    then raise exception 'FAIL: pausado ficou visível';end if;
  select count(*) into n from private.aprovacoes_perfil where profissional_usuario_id=pro;
  if n<>1 then raise exception 'FAIL: auditoria de aprovação';end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',pro,'is_anonymous',false,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',pro::text,true);
  execute 'set local role authenticated';
  update public.profissionais set pausado=false where usuario_id=pro;
  execute 'reset role';
  if not exists(select 1 from public.catalogo_profissionais where id=pid and ativo)
    then raise exception 'FAIL: retomada não atualizou catálogo';end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',pro,'is_anonymous',false,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',pro::text,true);
  execute 'set local role authenticated';
  update public.profissionais set descricao='Descrição alterada após análise' where usuario_id=pro;
  execute 'reset role';
  if exists(select 1 from public.profissionais where usuario_id=pro and publicado) or
     exists(select 1 from public.catalogo_profissionais where id=pid and ativo)
    then raise exception 'FAIL: alteração material não retirou publicação';end if;
  select jsonb_build_object('nome',nome,'cidade',cidade,'servico',servico,'descricao',descricao,
    'tipo_prestador',tipo_prestador,'tipo_atividade',tipo_atividade)
    into atual from public.profissionais where usuario_id=pro;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',revisor,'is_anonymous',false,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',revisor::text,true);
  execute 'set local role authenticated';
  begin perform public.aprovar_perfil_administrativo(pro,esperado);raise exception 'FAIL: versão antiga aprovada';exception when serialization_failure then null;end;
  perform public.aprovar_perfil_administrativo(pro,atual);
  execute 'reset role';
  select count(*) into n from private.aprovacoes_perfil where profissional_usuario_id=pro;
  if n<>2 then raise exception 'FAIL: nova análise sem auditoria própria';end if;
  update private.revisores_perfil set ativo=false where usuario_id=revisor;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',revisor,'is_anonymous',false,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',revisor::text,true);
  execute 'set local role authenticated';
  begin perform public.listar_perfis_revisao(0);raise exception 'FAIL: revogado lê fila';exception when insufficient_privilege then null;end;
  begin perform public.aprovar_perfil_administrativo(pro,atual);raise exception 'FAIL: revogado aprova';exception when insufficient_privilege then null;end;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',terceiro,'is_anonymous',false,'role','authenticated','user_metadata',jsonb_build_object('admin',true))::text,true);
  perform set_config('request.jwt.claim.sub',terceiro::text,true);
  execute 'set local role authenticated';
  begin perform public.listar_perfis_revisao(0);raise exception 'FAIL: metadata elevou terceiro';exception when insufficient_privilege then null;end;
  begin perform public.aprovar_perfil_administrativo(pro,atual);raise exception 'FAIL: terceiro aprova';exception when insufficient_privilege then null;end;
  execute 'reset role';
end $teste$;
rollback;
