-- Apenas homologação: andamento de atendimento, sem efeito financeiro.
create table public.acompanhamento_reclamacoes (
  operacao_id uuid primary key,
  solicitacao_id uuid not null references public.reclamacoes_servico(solicitacao_id),
  versao integer not null check(versao > 0),
  status text not null check(status in ('em_analise','concluida')),
  mensagem text not null check(char_length(btrim(mensagem)) >= 10 and char_length(mensagem) <= 2000),
  autor_usuario_id uuid not null references auth.users(id),
  criado_em timestamptz not null default now(),
  unique(solicitacao_id,versao)
);
alter table public.acompanhamento_reclamacoes enable row level security;
revoke all on public.acompanhamento_reclamacoes from public,anon,authenticated,service_role;
grant select on public.acompanhamento_reclamacoes to authenticated;
create policy acompanhamento_identificado on public.acompanhamento_reclamacoes as restrictive for select to authenticated
using((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous','false')='false');
create policy acompanhamento_partes on public.acompanhamento_reclamacoes for select to authenticated using(exists(
 select 1 from public.solicitacoes s where s.id=acompanhamento_reclamacoes.solicitacao_id
 and (select auth.uid()) in(s.cliente_usuario_id,s.profissional_usuario_id)
));
comment on table public.acompanhamento_reclamacoes is 'Histórico imutável de atendimento. Concluída significa encerramento do atendimento, sem executar reembolso ou limitar direitos legais.';

create function revisao_admin.atualizar_reclamacao(pedido_id uuid,operacao_id uuid,versao_esperada integer,novo_status text,mensagem text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); atual integer; estado text; salvo public.acompanhamento_reclamacoes%rowtype;
begin
 if uid is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false' then raise exception 'Área restrita' using errcode='42501';end if;
 perform 1 from private.revisores_perfil r where r.usuario_id=uid and r.ativo for share;
 if not found then raise exception 'Área restrita' using errcode='42501';end if;
 -- Serializa atualizações do mesmo caso e impede que o revisor atue no próprio pedido.
 perform 1 from public.reclamacoes_servico r join public.solicitacoes s on s.id=r.solicitacao_id
 where r.solicitacao_id=pedido_id and uid not in(s.cliente_usuario_id,s.profissional_usuario_id) for update of r;
 if not found then raise exception 'Caso indisponível' using errcode='42501';end if;
 if operacao_id is null or versao_esperada is null or versao_esperada<0 or novo_status is null or novo_status not in('em_analise','concluida')
 or mensagem is null or char_length(btrim(mensagem))<10 or char_length(mensagem)>2000 then raise exception 'Dados inválidos' using errcode='22023';end if;
 select a.* into salvo from public.acompanhamento_reclamacoes a where a.operacao_id=atualizar_reclamacao.operacao_id;
 if found then
  if salvo.solicitacao_id=pedido_id and salvo.autor_usuario_id=uid and salvo.versao=versao_esperada+1 and salvo.status=novo_status and salvo.mensagem=btrim(mensagem)
  then return jsonb_build_object('versao',salvo.versao,'status',salvo.status);end if;
  raise exception 'Identificador já utilizado' using errcode='23505';
 end if;
 select a.versao,a.status into atual,estado from public.acompanhamento_reclamacoes a where a.solicitacao_id=pedido_id order by a.versao desc limit 1;
 atual:=coalesce(atual,0);estado:=coalesce(estado,'aguardando_analise');
 if atual<>versao_esperada then raise exception 'Caso atualizado; consulte novamente' using errcode='40001';end if;
 if not((estado='aguardando_analise' and novo_status='em_analise') or estado='em_analise' or(estado='concluida' and novo_status='em_analise')) then
 raise exception 'Transição inválida' using errcode='22023';end if;
 insert into public.acompanhamento_reclamacoes(operacao_id,solicitacao_id,versao,status,mensagem,autor_usuario_id)
 values(operacao_id,pedido_id,atual+1,novo_status,btrim(mensagem),uid);
 return jsonb_build_object('versao',atual+1,'status',novo_status);
end;
$$;
revoke all on function revisao_admin.atualizar_reclamacao(uuid,uuid,integer,text,text) from public,anon,service_role;
grant execute on function revisao_admin.atualizar_reclamacao(uuid,uuid,integer,text,text) to authenticated;
create function public.atualizar_acompanhamento_reclamacao(pedido_id uuid,operacao_id uuid,versao_esperada integer,novo_status text,mensagem text)
returns jsonb language sql security invoker set search_path='' as $$select revisao_admin.atualizar_reclamacao(pedido_id,operacao_id,versao_esperada,novo_status,mensagem);$$;
revoke all on function public.atualizar_acompanhamento_reclamacao(uuid,uuid,integer,text,text) from public,anon,service_role;
grant execute on function public.atualizar_acompanhamento_reclamacao(uuid,uuid,integer,text,text) to authenticated;

create function revisao_admin.historico_reclamacao(pedido_id uuid,antes_versao integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); resultado jsonb;
begin
 if uid is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false' then raise exception 'Área restrita' using errcode='42501';end if;
 if antes_versao is null or antes_versao<1 then raise exception 'Página inválida' using errcode='22023';end if;
 if not exists(select 1 from public.reclamacoes_servico r join public.solicitacoes s on s.id=r.solicitacao_id where r.solicitacao_id=pedido_id and uid in(s.cliente_usuario_id,s.profissional_usuario_id)) then
  perform 1 from private.revisores_perfil r where r.usuario_id=uid and r.ativo for share;
  if not found then raise exception 'Área restrita' using errcode='42501';end if;
  if not exists(select 1 from public.reclamacoes_servico r where r.solicitacao_id=pedido_id) then raise exception 'Caso indisponível' using errcode='42501';end if;
 end if;
 select coalesce(jsonb_agg(item order by versao desc),'[]'::jsonb) into resultado from(
 select a.versao,jsonb_build_object('versao',a.versao,'status',a.status,'mensagem',a.mensagem,'criado_em',a.criado_em) item
 from public.acompanhamento_reclamacoes a where a.solicitacao_id=pedido_id and a.versao<antes_versao order by a.versao desc limit 51
 ) pagina;
 return resultado;
end;
$$;
revoke all on function revisao_admin.historico_reclamacao(uuid,integer) from public,anon,service_role;
grant execute on function revisao_admin.historico_reclamacao(uuid,integer) to authenticated;
create function public.consultar_acompanhamento_reclamacao(pedido_id uuid,antes_versao integer default 2147483647)
returns jsonb language sql security invoker set search_path='' as $$select revisao_admin.historico_reclamacao(pedido_id,antes_versao);$$;
revoke all on function public.consultar_acompanhamento_reclamacao(uuid,integer) from public,anon,service_role;
grant execute on function public.consultar_acompanhamento_reclamacao(uuid,integer) to authenticated;

create or replace function revisao_admin.listar_reclamacoes(pagina integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); resultado jsonb;
begin
 if uid is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false' then raise exception 'Área restrita' using errcode='42501';end if;
 perform 1 from private.revisores_perfil r where r.usuario_id=uid and r.ativo for share;
 if not found then raise exception 'Área restrita' using errcode='42501';end if;
 if pagina is null or pagina<0 or pagina>10000 then raise exception 'Página inválida' using errcode='22023';end if;
 select coalesce(jsonb_agg(item order by criado_em,solicitacao_id),'[]'::jsonb) into resultado from(
 select r.criado_em,r.solicitacao_id,jsonb_build_object(
 'solicitacao_id',r.solicitacao_id,'titulo',s.titulo,'motivo',r.motivo,'descricao',r.descricao,'criado_em',r.criado_em,
 'status',coalesce(a.status,'aguardando_analise'),'versao',coalesce(a.versao,0),
 'resposta',case when p.solicitacao_id is null then null else jsonb_build_object('descricao',p.descricao,'criado_em',p.criado_em) end) item
 from public.reclamacoes_servico r join public.solicitacoes s on s.id=r.solicitacao_id
 left join public.respostas_reclamacao p on p.solicitacao_id=r.solicitacao_id
 left join lateral(select h.versao,h.status from public.acompanhamento_reclamacoes h where h.solicitacao_id=r.solicitacao_id order by h.versao desc limit 1) a on true
 where uid not in(s.cliente_usuario_id,s.profissional_usuario_id)
 order by r.criado_em,r.solicitacao_id limit 51 offset pagina*50
 ) fila;return resultado;
end;
$$;
