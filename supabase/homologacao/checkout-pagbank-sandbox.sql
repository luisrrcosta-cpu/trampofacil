-- Checkout hospedado somente sandbox. Não modifica tabelas financeiras inertes.
create table private.checkouts_pagbank_sandbox (
 id uuid primary key default gen_random_uuid(),
 preparacao_id uuid not null unique references private.preparacoes_pagamento(id),
 usuario_id uuid not null,
 valor_centavos integer not null check(valor_centavos between 100 and 100000000),
 referencia text not null unique check(length(referencia)<=64),
 estado text not null check(estado in ('envio_iniciado','criado','incerto','bloqueado')),
 checkout_id text unique check(checkout_id is null or checkout_id ~ '^CHEC_[A-Za-z0-9-]{1,100}$'),
 url text check(url is null or length(url)<=2048),
 ambiente text not null default 'sandbox' check(ambiente='sandbox'),
 pagamento_real_habilitado boolean not null default false check(pagamento_real_habilitado=false),
 repasse_habilitado boolean not null default false check(repasse_habilitado=false),
 criado_em timestamptz not null default now()
);
alter table private.checkouts_pagbank_sandbox enable row level security;
revoke all on private.checkouts_pagbank_sandbox from public,anon,authenticated,service_role;
grant select,insert,update on private.checkouts_pagbank_sandbox to service_role;
create function private.iniciar_checkout_sandbox(p_preparacao uuid,p_usuario uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare p private.preparacoes_pagamento%rowtype;s public.solicitacoes%rowtype;c private.checkouts_pagbank_sandbox%rowtype;novo_id uuid;novo boolean:=false;
begin
 select * into p from private.preparacoes_pagamento where id=p_preparacao and cliente_usuario_id=p_usuario;
 if not found then raise exception 'Indisponível' using errcode='P0002';end if;
 select * into s from public.solicitacoes where id=p.solicitacao_id for update;
 if not found or s.status<>'aceita' or s.cliente_usuario_id<>p_usuario or
    s.atualizado_em<>p.versao_orcamento or s.valor_centavos<>p.valor_servico_centavos or
    p.forma<>'credito_avista' or p.parcelas<>1 then raise exception 'Orçamento indisponível' using errcode='22023';end if;
 select * into c from private.checkouts_pagbank_sandbox where preparacao_id=p.id;
 if not found then
  novo_id=gen_random_uuid();
  insert into private.checkouts_pagbank_sandbox(id,preparacao_id,usuario_id,valor_centavos,referencia,estado)
   values(novo_id,p.id,p_usuario,p.valor_servico_centavos,'tf-sandbox-'||novo_id,'envio_iniciado') returning * into c;
  novo=true;
 end if;
 return jsonb_build_object('novo',novo,'id',c.id,'referencia',c.referencia,'valorCentavos',c.valor_centavos,
   'estado',c.estado,'checkoutId',c.checkout_id,'url',c.url,'criadoEm',c.criado_em);
end;$$;
create function private.finalizar_checkout_sandbox(p_id uuid,p_checkout text,p_url text)
returns text language plpgsql security invoker set search_path='' as $$
declare c private.checkouts_pagbank_sandbox%rowtype;p private.preparacoes_pagamento%rowtype;s public.solicitacoes%rowtype;resultado text;
begin
 select * into c from private.checkouts_pagbank_sandbox where id=p_id for update;
 if not found or c.estado<>'envio_iniciado' then raise exception 'Estado indisponível' using errcode='22023';end if;
 if p_checkout is null and p_url is null then
  update private.checkouts_pagbank_sandbox set estado='incerto' where id=c.id;return 'incerto';
 end if;
 if p_checkout is null or p_checkout !~ '^CHEC_[A-Za-z0-9-]{1,100}$' or p_url is null or
    p_url !~ '^https://(qa|sandbox)\.pagamento\.(pagseguro\.uol\.com\.br|pagbank\.com\.br)/pagamento\?code=[A-Za-z0-9-]+$'
 then raise exception 'Resposta indisponível' using errcode='22023';end if;
 select * into p from private.preparacoes_pagamento where id=c.preparacao_id;
 select * into s from public.solicitacoes where id=p.solicitacao_id for update;
 resultado=case when s.status='aceita' and s.atualizado_em=p.versao_orcamento and s.valor_centavos=c.valor_centavos then 'criado' else 'bloqueado' end;
 update private.checkouts_pagbank_sandbox set estado=resultado,checkout_id=p_checkout,url=p_url where id=c.id;
 return resultado;
end;$$;
revoke all on function private.iniciar_checkout_sandbox(uuid,uuid) from public,anon,authenticated;
revoke all on function private.finalizar_checkout_sandbox(uuid,text,text) from public,anon,authenticated;
grant execute on function private.iniciar_checkout_sandbox(uuid,uuid) to service_role;
grant execute on function private.finalizar_checkout_sandbox(uuid,text,text) to service_role;
