-- Aplicar somente em homologação. Não cria cobrança nem altera solicitações.
begin;

create table private.preparacoes_pagamento (
  id uuid primary key default gen_random_uuid(),
  solicitacao_id uuid not null references public.solicitacoes(id),
  cliente_usuario_id uuid not null references auth.users(id),
  profissional_usuario_id uuid not null references auth.users(id),
  versao_orcamento timestamptz not null,
  valor_servico_centavos integer not null check (valor_servico_centavos between 100 and 100000000),
  comissao_centavos integer not null,
  profissional_centavos integer not null,
  forma text not null,
  parcelas integer not null,
  ambiente text not null default 'teste' check (ambiente = 'teste'),
  estado text not null default 'preparada' check (estado = 'preparada'),
  pagamento_habilitado boolean not null default false check (pagamento_habilitado = false),
  criado_em timestamptz not null default now(),
  constraint preparacao_unica_por_versao unique (solicitacao_id, versao_orcamento),
  check (cliente_usuario_id <> profissional_usuario_id),
  check (comissao_centavos = (valor_servico_centavos + 5) / 10),
  check (profissional_centavos = valor_servico_centavos - comissao_centavos),
  check ((forma = 'credito_avista' and parcelas = 1)
    or (forma = 'credito_parcelado' and parcelas between 2 and 10))
);
alter table private.preparacoes_pagamento enable row level security;
revoke all on private.preparacoes_pagamento from public, anon, authenticated, service_role;
grant usage on schema private to service_role;
grant select, insert on private.preparacoes_pagamento to service_role;
create index preparacoes_cliente_idx on private.preparacoes_pagamento (cliente_usuario_id);
create index preparacoes_profissional_idx on private.preparacoes_pagamento (profissional_usuario_id);

-- Somente um servidor confiável pode chamar esta função pelo banco, após
-- validar a sessão no Auth. p_cliente_usuario_id nunca vem do corpo HTTP.
-- Não expor private na Data API nem criar um wrapper público sem nova revisão.
create function private.registrar_preparacao_pagamento(
  p_solicitacao_id uuid,
  p_cliente_usuario_id uuid,
  p_versao_orcamento timestamptz,
  p_forma text,
  p_parcelas integer
)
returns private.preparacoes_pagamento
language plpgsql security invoker
set search_path = ''
as $$
declare
  pedido public.solicitacoes%rowtype;
  existente private.preparacoes_pagamento%rowtype;
begin
  if p_solicitacao_id is null or p_cliente_usuario_id is null or p_versao_orcamento is null
    or p_forma is null or p_parcelas is null
    or not ((p_forma = 'credito_avista' and p_parcelas = 1)
      or (p_forma = 'credito_parcelado' and p_parcelas between 2 and 10)) then
    raise exception 'Preparação inválida.' using errcode = '22023';
  end if;

  -- Serializa preparações do mesmo pedido e impede cancelar/mudar o pedido
  -- durante a conferência e a gravação desta transação.
  select * into pedido from public.solicitacoes
    where id = p_solicitacao_id and cliente_usuario_id = p_cliente_usuario_id
    for update;
  if not found then
    raise exception 'Solicitação indisponível.' using errcode = 'P0002';
  end if;
  if pedido.status <> 'aceita' or pedido.atualizado_em <> p_versao_orcamento
    or pedido.valor_centavos is null or pedido.valor_centavos not between 100 and 100000000 then
    raise exception 'Orçamento alterado ou indisponível.' using errcode = '22023';
  end if;

  select * into existente from private.preparacoes_pagamento
    where solicitacao_id = pedido.id and versao_orcamento = pedido.atualizado_em;
  if found then
    if existente.forma <> p_forma or existente.parcelas <> p_parcelas
      or existente.cliente_usuario_id <> pedido.cliente_usuario_id
      or existente.profissional_usuario_id <> pedido.profissional_usuario_id
      or existente.valor_servico_centavos <> pedido.valor_centavos then
      raise exception 'Já existe preparação com condições diferentes.' using errcode = '22023';
    end if;
    return existente;
  end if;

  insert into private.preparacoes_pagamento (
    solicitacao_id, cliente_usuario_id, profissional_usuario_id, versao_orcamento,
    valor_servico_centavos, comissao_centavos, profissional_centavos, forma, parcelas
  ) values (
    pedido.id, pedido.cliente_usuario_id, pedido.profissional_usuario_id, pedido.atualizado_em,
    pedido.valor_centavos, (pedido.valor_centavos + 5) / 10,
    pedido.valor_centavos - (pedido.valor_centavos + 5) / 10, p_forma, p_parcelas
  ) returning * into existente;
  return existente;
end;
$$;
revoke all on function private.registrar_preparacao_pagamento(uuid, uuid, timestamptz, text, integer)
  from public, anon, authenticated;
grant execute on function private.registrar_preparacao_pagamento(uuid, uuid, timestamptz, text, integer)
  to service_role;

commit;
