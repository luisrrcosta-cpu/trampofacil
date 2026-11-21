-- TrampoFácil: trilha financeira inerte, exclusiva da homologação.
-- Não cria cobranças, endpoints, credenciais, webhooks nem repasses.
create table private.tentativas_pagamento_teste (
  id uuid primary key default gen_random_uuid(),
  preparacao_id uuid not null references private.preparacoes_pagamento(id),
  chave_idempotencia uuid not null unique,
  referencia_externa text,
  cobranca_id text,
  valor_centavos integer not null check (valor_centavos between 100 and 100000000),
  ambiente text not null default 'sandbox' check (ambiente = 'sandbox'),
  estado text not null default 'criada' check (estado in ('criada','aguardando','em_analise','autorizada','paga_observada','recusada','cancelada','devolucao_parcial','devolucao_total','revisao_necessaria')),
  pago_centavos integer not null default 0 check (pago_centavos >= 0),
  devolvido_centavos integer not null default 0 check (devolvido_centavos >= 0),
  pagamento_habilitado boolean not null default false check (pagamento_habilitado = false),
  repasse_habilitado boolean not null default false check (repasse_habilitado = false),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint valores_financeiros_consistentes check (devolvido_centavos <= pago_centavos and pago_centavos <= valor_centavos),
  constraint referencia_externa_formato check (referencia_externa is null or (length(referencia_externa) between 1 and 100 and referencia_externa ~ '^[A-Za-z0-9_-]+$')),
  constraint cobranca_id_formato check (cobranca_id is null or cobranca_id ~ '^CHAR_[A-Za-z0-9-]{1,100}$'),
  constraint cobranca_sem_pagamento_real check (cobranca_id is null and referencia_externa is null and pago_centavos = 0 and devolvido_centavos = 0 and estado in ('criada','revisao_necessaria'))
);
create index tentativas_preparacao_idx on private.tentativas_pagamento_teste(preparacao_id);
create table private.eventos_tentativa_pagamento_teste (
  id uuid primary key default gen_random_uuid(),
  tentativa_id uuid not null references private.tentativas_pagamento_teste(id),
  tipo text not null check (tipo in ('criada','verificacao','revisao_necessaria')),
  detalhe text check (detalhe is null or length(detalhe) <= 240),
  criado_em timestamptz not null default now()
);
create index eventos_tentativa_idx on private.eventos_tentativa_pagamento_teste(tentativa_id,criado_em);
alter table private.tentativas_pagamento_teste enable row level security;
alter table private.eventos_tentativa_pagamento_teste enable row level security;
revoke all on private.tentativas_pagamento_teste from public, anon, authenticated, service_role;
revoke all on private.eventos_tentativa_pagamento_teste from public, anon, authenticated, service_role;
grant select, insert on private.tentativas_pagamento_teste to service_role;
grant select, insert on private.eventos_tentativa_pagamento_teste to service_role;
comment on table private.tentativas_pagamento_teste is 'Registro inerte de tentativa financeira de homologação; não autoriza cobrança ou repasse.';
comment on table private.eventos_tentativa_pagamento_teste is 'Trilha interna inerte; não recebe notificações de provedor.';
