-- Caixa de entrada privada: não altera tentativas, serviços ou saldos.
create table private.recebimentos_webhook_sandbox (
  hash_sha256 text primary key check (hash_sha256 ~ '^[0-9a-f]{64}$'),
  cobrancas text[] not null check (cardinality(cobrancas) between 1 and 10),
  ambiente text not null default 'sandbox' check (ambiente='sandbox'),
  estado text not null default 'aguardando_conferencia' check (estado='aguardando_conferencia'),
  financeiro_processado boolean not null default false check (financeiro_processado=false),
  criado_em timestamptz not null default now()
);
alter table private.recebimentos_webhook_sandbox enable row level security;
revoke all on private.recebimentos_webhook_sandbox from public,anon,authenticated,service_role;
grant select,insert on private.recebimentos_webhook_sandbox to service_role;
create function private.receber_webhook_sandbox(p_hash text,p_cobrancas text[])
returns boolean language plpgsql security invoker set search_path='' as $$
declare existentes text[]; novo boolean;
begin
  if p_hash is null or p_hash !~ '^[0-9a-f]{64}$' or p_cobrancas is null
    or cardinality(p_cobrancas) not between 1 and 10
    or exists(select 1 from unnest(p_cobrancas) c where c is null or c !~ '^CHAR_[A-Za-z0-9-]{1,100}$')
    or (select count(distinct c) from unnest(p_cobrancas) c) <> cardinality(p_cobrancas) then
    raise exception 'Notificação inválida.' using errcode='22023';
  end if;
  insert into private.recebimentos_webhook_sandbox(hash_sha256,cobrancas)
    values(p_hash,p_cobrancas) on conflict(hash_sha256) do nothing;
  novo=found;
  select cobrancas into existentes from private.recebimentos_webhook_sandbox where hash_sha256=p_hash;
  if existentes is distinct from p_cobrancas then
    raise exception 'Notificação divergente.' using errcode='22023';
  end if;
  return novo;
end;
$$;
revoke all on function private.receber_webhook_sandbox(text,text[]) from public,anon,authenticated;
grant execute on function private.receber_webhook_sandbox(text,text[]) to service_role;
comment on table private.recebimentos_webhook_sandbox is 'Notificações sandbox autenticadas pendentes de conferência; sem payload pessoal, pagamento ou repasse.';
