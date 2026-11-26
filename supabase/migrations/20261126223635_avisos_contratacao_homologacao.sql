-- Homologação: deriva avisos do histórico existente, sem alterar triggers ou pedidos.
alter table private.leituras_avisos_atendimento drop constraint leituras_avisos_atendimento_tipo_check;
alter table private.leituras_avisos_atendimento add constraint leituras_avisos_atendimento_tipo_check check(tipo in('administracao','resposta_profissional','contratacao'));

create or replace function revisao_admin.listar_avisos_atendimento(antes_em timestamptz,antes_tipo text,antes_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();resultado jsonb;
begin
 if uid is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false' then raise exception 'Entre na sua conta' using errcode='42501';end if;
 if num_nonnulls(antes_em,antes_tipo,antes_id) not in(0,3) or(antes_tipo is not null and antes_tipo not in('administracao','resposta_profissional','contratacao')) then
 raise exception 'Página inválida' using errcode='22023';end if;
 select coalesce(jsonb_agg(item order by criado_em desc,tipo desc,evento_id desc),'[]'::jsonb) into resultado from(
 select x.criado_em,x.tipo,x.evento_id,jsonb_build_object('evento_id',x.evento_id,'tipo',x.tipo,'solicitacao_id',x.solicitacao_id,'titulo',x.titulo,
 'mensagem',x.mensagem,'status',x.status,'criado_em',x.criado_em,'lido_em',l.lido_em) item
 from(
 select a.operacao_id evento_id,'administracao'::text tipo,a.solicitacao_id,s.titulo,a.mensagem,a.status,a.criado_em
 from public.acompanhamento_reclamacoes a join public.solicitacoes s on s.id=a.solicitacao_id
 where uid in(s.cliente_usuario_id,s.profissional_usuario_id)
 union all
 select r.solicitacao_id,'resposta_profissional'::text,r.solicitacao_id,s.titulo,r.descricao,null::text,r.criado_em
 from public.respostas_reclamacao r join public.solicitacoes s on s.id=r.solicitacao_id
 where uid=s.cliente_usuario_id and uid<>s.profissional_usuario_id

 union all
 select h.id,'contratacao'::text,h.solicitacao_id,s.titulo,
 case h.status
 when 'solicitada' then 'Você recebeu uma nova solicitação de serviço.'
 when 'proposta' then 'O profissional enviou ou atualizou uma proposta. Consulte os detalhes antes de aceitar.'
 when 'aceita' then 'O cliente aceitou a proposta do serviço.'
 when 'em_andamento' then 'O profissional marcou o serviço como em andamento.'
 when 'entregue' then 'O profissional informou a entrega do serviço. Confira os detalhes na solicitação.'
 when 'concluida' then 'O cliente confirmou a conclusão do serviço.'
 when 'cancelada' then 'A outra parte cancelou a solicitação. Consulte os detalhes. Este aviso não confirma estorno.' end,
 h.status,h.criado_em
 from public.historico_solicitacoes h join public.solicitacoes s on s.id=h.solicitacao_id
 where uid in(s.cliente_usuario_id,s.profissional_usuario_id)
 and h.ator_usuario_id=case when uid=s.cliente_usuario_id then s.profissional_usuario_id else s.cliente_usuario_id end
 and h.status in('solicitada','proposta','aceita','em_andamento','entregue','concluida','cancelada')
 ) x left join private.leituras_avisos_atendimento l on l.usuario_id=uid and l.tipo=x.tipo and l.evento_id=x.evento_id
 where antes_em is null or (x.criado_em,x.tipo,x.evento_id)<(antes_em,antes_tipo,antes_id)
 order by x.criado_em desc,x.tipo desc,x.evento_id desc limit 51
 ) pagina;return resultado;
end;
$$;
revoke all on function revisao_admin.listar_avisos_atendimento(timestamptz,text,uuid) from public,anon,service_role;
grant execute on function revisao_admin.listar_avisos_atendimento(timestamptz,text,uuid) to authenticated;

create or replace function revisao_admin.marcar_aviso_atendimento(tipo text,evento_id uuid)
returns timestamptz language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();horario timestamptz;
begin
 if uid is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false' then raise exception 'Entre na sua conta' using errcode='42501';end if;
 if tipo is null or tipo not in('administracao','resposta_profissional','contratacao') or evento_id is null then raise exception 'Dados inválidos' using errcode='22023';end if;
 if tipo='administracao' then
  if not exists(select 1 from public.acompanhamento_reclamacoes a join public.solicitacoes s on s.id=a.solicitacao_id
  where a.operacao_id=evento_id and uid in(s.cliente_usuario_id,s.profissional_usuario_id)) then raise exception 'Aviso indisponível' using errcode='42501';end if;
 elsif tipo='resposta_profissional' then
  if not exists(select 1 from public.respostas_reclamacao r join public.solicitacoes s on s.id=r.solicitacao_id
  where r.solicitacao_id=evento_id and uid=s.cliente_usuario_id and uid<>s.profissional_usuario_id) then raise exception 'Aviso indisponível' using errcode='42501';end if;
 else
  if not exists(select 1 from public.historico_solicitacoes h join public.solicitacoes s on s.id=h.solicitacao_id
  where h.id=evento_id and uid in(s.cliente_usuario_id,s.profissional_usuario_id)
  and h.ator_usuario_id=case when uid=s.cliente_usuario_id then s.profissional_usuario_id else s.cliente_usuario_id end
  and h.status in('solicitada','proposta','aceita','em_andamento','entregue','concluida','cancelada')) then raise exception 'Aviso indisponível' using errcode='42501';end if;
 end if;
 insert into private.leituras_avisos_atendimento(usuario_id,tipo,evento_id) values(uid,tipo,evento_id) on conflict do nothing;
 select l.lido_em into horario from private.leituras_avisos_atendimento l where l.usuario_id=uid and l.tipo=marcar_aviso_atendimento.tipo and l.evento_id=marcar_aviso_atendimento.evento_id;
 return horario;
end;
$$;
revoke all on function revisao_admin.marcar_aviso_atendimento(text,uuid) from public,anon,service_role;
grant execute on function revisao_admin.marcar_aviso_atendimento(text,uuid) to authenticated;
