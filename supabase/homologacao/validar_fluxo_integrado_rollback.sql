-- Executar somente em TrampoFacil-Homologacao (asdszqtpydiowgerxwee).
-- Dados fictícios e roles reais do PostgreSQL, sempre ROLLBACK.
-- Não envia e-mail, não usa JWT/OTP reais, não processa pagamentos.
begin;
do $teste$
declare
  cli uuid:=gen_random_uuid(); pro uuid:=gen_random_uuid(); terceiro uuid:=gen_random_uuid();
  pid uuid; sid uuid:=gen_random_uuid(); n bigint; prestador text; atividade text;
begin
  insert into auth.users(id,email,aud,role,email_confirmed_at) values
    (cli,'qa-'||cli||'@example.invalid','authenticated','authenticated',now()),
    (pro,'qa-'||pro||'@example.invalid','authenticated','authenticated',now()),
    (terceiro,'qa-'||terceiro||'@example.invalid','authenticated','authenticated',now());
  perform set_config('request.jwt.claims',jsonb_build_object('sub',pro,'role','authenticated','is_anonymous',false)::text,true);
  perform set_config('request.jwt.claim.sub',pro::text,true);
  execute 'set local role authenticated';
  foreach prestador in array array['pessoa_fisica','mei','empresa'] loop
    foreach atividade in array array['regular','ocasional'] loop
      insert into public.profissionais(usuario_id,nome,cidade,servico,descricao,telefone,tipo_prestador,tipo_atividade)
      values(pro,'QA Profissional fictício','Cidade fictícia','Serviço fictício','Descrição fictícia','11999999999',prestador,atividade)
      on conflict(usuario_id) do update set tipo_prestador=excluded.tipo_prestador,tipo_atividade=excluded.tipo_atividade;
      if not exists(select 1 from public.profissionais where usuario_id=pro and tipo_prestador=prestador and tipo_atividade=atividade and not publicado)
        then raise exception 'Modalidade inválida ou publicação indevida'; end if;
    end loop;
  end loop;
  select id into strict pid from public.profissionais where usuario_id=pro;
  begin
    update public.profissionais set publicado=true where usuario_id=pro;
    raise exception 'FAIL: autopublicação permitida';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',cli,'email','qa-'||cli||'@example.invalid','role','authenticated','is_anonymous',false)::text,true);
  perform set_config('request.jwt.claim.sub',cli::text,true);
  execute 'set local role authenticated';
  begin
    insert into public.clientes(usuario_id,nome,email,cidade,telefone)
      values(cli,'QA Cliente fictício','outro-'||cli||'@example.invalid','Cidade fictícia','11999999999');
    raise exception 'FAIL: cadastro com e-mail diferente da identidade';
  exception when insufficient_privilege then null; end;
  insert into public.clientes(usuario_id,nome,email,cidade,telefone)
    values(cli,'QA Cliente fictício','qa-'||cli||'@example.invalid','Cidade fictícia','11999999999');
  update public.clientes set telefone='+5511999999999' where usuario_id=cli;
  update public.profissionais set nome='Tentativa bloqueada' where usuario_id=pro;
  get diagnostics n=row_count;
  if n<>0 then raise exception 'FAIL: edição de terceiro'; end if;
  if exists(select 1 from public.profissionais where usuario_id=pro) then raise exception 'FAIL: leitura de perfil privado'; end if;
  begin
    insert into public.profissionais(usuario_id,nome,cidade,servico,telefone,tipo_prestador,tipo_atividade)
      values(pro,'Upsert indevido','Cidade fictícia','Serviço fictício','11999999999','mei','regular')
      on conflict(usuario_id) do update set nome=excluded.nome;
    raise exception 'FAIL: upsert de terceiro';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  -- Aprovação administrativa apenas do registro fictício desta transação.
  update public.profissionais set publicado=true where id=pid;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',pro,'role','authenticated','is_anonymous',false)::text,true);
  perform set_config('request.jwt.claim.sub',pro::text,true);
  execute 'set local role authenticated';
  update public.profissionais set pausado=true where usuario_id=pro;
  execute 'reset role';
  if exists(select 1 from public.catalogo_profissionais where id=pid and ativo) then raise exception 'FAIL: pausado no catálogo'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',cli,'email','qa-'||cli||'@example.invalid','role','authenticated','is_anonymous',false)::text,true);
  perform set_config('request.jwt.claim.sub',cli::text,true);
  execute 'set local role authenticated';
  begin
    insert into public.solicitacoes(id,cliente_usuario_id,profissional_id,titulo,descricao)
      values(sid,cli,pid,'Pedido fictício QA','Descrição de teste fictícia');
    raise exception 'FAIL: pedido durante pausa';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',pro,'role','authenticated','is_anonymous',false)::text,true);
  perform set_config('request.jwt.claim.sub',pro::text,true);
  execute 'set local role authenticated';
  update public.profissionais set pausado=false where usuario_id=pro;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',cli,'email','qa-'||cli||'@example.invalid','role','authenticated','is_anonymous',false)::text,true);
  perform set_config('request.jwt.claim.sub',cli::text,true);
  execute 'set local role authenticated';
  insert into public.solicitacoes(id,cliente_usuario_id,profissional_id,titulo,descricao)
    values(sid,cli,pid,'Pedido fictício QA','Descrição de teste fictícia');
  begin
    insert into public.pedidos_nota_fiscal(solicitacao_id) values(sid);
    raise exception 'FAIL: nota antes de aceite';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',pro,'role','authenticated','is_anonymous',false)::text,true);
  perform set_config('request.jwt.claim.sub',pro::text,true);
  execute 'set local role authenticated';
  update public.solicitacoes set status='proposta',valor_centavos=10000 where id=sid;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',cli,'email','qa-'||cli||'@example.invalid','role','authenticated','is_anonymous',false)::text,true);
  perform set_config('request.jwt.claim.sub',cli::text,true);
  execute 'set local role authenticated';
  update public.solicitacoes set status='aceita' where id=sid;
  insert into public.pedidos_nota_fiscal(solicitacao_id) values(sid);
  begin
    insert into public.pedidos_nota_fiscal(solicitacao_id) values(sid);
    raise exception 'FAIL: nota duplicada';
  exception when unique_violation then null; end;
  begin
    update public.pedidos_nota_fiscal set estado='emitida' where solicitacao_id=sid;
    raise exception 'FAIL: emissão forjada';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',terceiro,'role','authenticated','is_anonymous',false)::text,true);
  perform set_config('request.jwt.claim.sub',terceiro::text,true);
  execute 'set local role authenticated';
  if exists(select 1 from public.solicitacoes where id=sid) or exists(select 1 from public.pedidos_nota_fiscal where solicitacao_id=sid)
    then raise exception 'FAIL: terceiro lê contratação ou nota'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',pro,'role','authenticated','is_anonymous',false)::text,true);
  perform set_config('request.jwt.claim.sub',pro::text,true);
  execute 'set local role authenticated';
  if not exists(select 1 from public.pedidos_nota_fiscal where solicitacao_id=sid and solicitante_usuario_id=cli)
    then raise exception 'FAIL: profissional não lê pedido'; end if;
  insert into public.atendimentos_pedido_nota(solicitacao_id) values(sid);
  begin
    insert into public.atendimentos_pedido_nota(solicitacao_id) values(sid);
    raise exception 'FAIL: atendimento duplicado';
  exception when unique_violation then null; end;
  if not exists(select 1 from public.atendimentos_pedido_nota where solicitacao_id=sid and profissional_usuario_id=pro)
    then raise exception 'FAIL: atendimento do profissional'; end if;
  update public.solicitacoes set status='em_andamento' where id=sid;
  update public.solicitacoes set status='entregue' where id=sid;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',cli,'email','qa-'||cli||'@example.invalid','role','authenticated','is_anonymous',false)::text,true);
  perform set_config('request.jwt.claim.sub',cli::text,true);
  execute 'set local role authenticated';
  if not exists(select 1 from public.atendimentos_pedido_nota where solicitacao_id=sid and profissional_usuario_id=pro)
    then raise exception 'FAIL: cliente não lê atendimento'; end if;
  begin
    insert into public.atendimentos_pedido_nota(solicitacao_id) values(sid);
    raise exception 'FAIL: cliente confirma pelo profissional';
  exception when insufficient_privilege then null; end;
  update public.solicitacoes set status='concluida' where id=sid;
  if not exists(select 1 from public.solicitacoes where id=sid and status='concluida' and valor_centavos=10000)
    then raise exception 'FAIL: conclusão ou valor'; end if;
  execute 'reset role';
  select count(*) into n from public.historico_solicitacoes where solicitacao_id=sid;
  if n<>6 then raise exception 'FAIL: histórico %, esperado 6',n; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',cli,'email','qa-'||cli||'@example.invalid','role','authenticated','is_anonymous',true)::text,true);
  perform set_config('request.jwt.claim.sub',cli::text,true);
  execute 'set local role authenticated';
  if exists(select 1 from public.clientes where usuario_id=cli) or exists(select 1 from public.pedidos_nota_fiscal where solicitacao_id=sid)
    then raise exception 'FAIL: sessão anônima acessa dados privados'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',terceiro,'role','authenticated','is_anonymous',false)::text,true);
  perform set_config('request.jwt.claim.sub',terceiro::text,true);
  execute 'set local role authenticated';
  if exists(select 1 from public.atendimentos_pedido_nota where solicitacao_id=sid)
    then raise exception 'FAIL: terceiro lê atendimento'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claims','{}',true);
  perform set_config('request.jwt.claim.sub','',true);
  execute 'set local role anon';
  begin
    perform count(*) from public.pedidos_nota_fiscal;
    raise exception 'FAIL: anônimo lê notas';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
end;
$teste$;
rollback;
