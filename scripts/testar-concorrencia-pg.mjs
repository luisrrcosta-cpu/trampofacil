import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import postgres from 'postgres';

// Só banco descartável do job local/CI. Nunca aceitar URL do Supabase.
const url = new URL(process.env.TRAMPOFACIL_PG_CONCURRENCY_URL || 'http://invalido');
assert.ok(url.protocol === 'postgres:' && ['127.0.0.1','localhost'].includes(url.hostname) &&
  url.pathname === '/trampofacil_concorrencia_test' && !url.search && !url.hash,
  'Use somente PostgreSQL descartável em loopback, banco trampofacil_concorrencia_test.');
const opcoes = {max:1,prepare:false,connect_timeout:5,connection:{statement_timeout:10000,lock_timeout:7000}};
const admin=postgres(url.href,opcoes), a=postgres(url.href,opcoes), b=postgres(url.href,opcoes);
try {
  assert.equal((await admin`select current_database() as nome`)[0].nome,'trampofacil_concorrencia_test');
  assert.equal((await admin`select count(*)::int as n from pg_tables where schemaname in ('public','private','auth')`)[0].n,0,
    'O teste exige banco novo, sem tabelas de aplicação.');
  await admin.unsafe(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema private; create table auth.users(id uuid primary key);
    create table public.solicitacoes(id uuid primary key,cliente_usuario_id uuid not null,
      profissional_usuario_id uuid not null,status text not null,valor_centavos integer,atualizado_em timestamptz not null);
    alter table public.solicitacoes enable row level security;
    grant select,update on public.solicitacoes to service_role;`);
  const pasta=new URL('../supabase/migrations/',import.meta.url);
  const nomes=await readdir(pasta);
  const preparacao=nomes.find(n=>n.endsWith('_registrar_preparacao_pagamento_teste.sql'));
  await admin.unsafe(await readFile(new URL(preparacao,pasta),'utf8'));
  for(const nome of ['tentativas-financeiras-inertes.sql','registrar-tentativa-inerte.sql']) {
    await admin.unsafe(await readFile(new URL('../supabase/homologacao/'+nome,import.meta.url),'utf8'));
  }
  const cliente=randomUUID(), profissional=randomUUID(), pedido=randomUUID(), chave=randomUUID();
  await admin`insert into auth.users values (${cliente}),(${profissional})`;
  await admin`insert into public.solicitacoes values (${pedido},${cliente},${profissional},'aceita',15000,'2026-11-21T00:00:00Z')`;
  const [preparacaoSalva]=await admin`select id from private.registrar_preparacao_pagamento(
    ${pedido}::uuid,${cliente}::uuid,'2026-11-21T00:00:00Z'::timestamptz,'credito_parcelado',10)`;
  const registrar=tx=>tx`select private.registrar_tentativa_inerte(${preparacaoSalva.id}::uuid,${chave}::uuid) as id`;
  let liberar, avisar;
  const sinal=new Promise(resolve=>{avisar=resolve;});
  const barreira=new Promise(resolve=>{liberar=resolve;});
  let primeiraId;
  const primeira=a.begin(async tx=>{
    await tx`set local role service_role`;
    primeiraId=(await registrar(tx))[0].id;
    avisar();
    await barreira; // manter o advisory lock enquanto B tenta a mesma operação
    return primeiraId;
  });
  // Sempre observar rejeições e liberar A, inclusive quando a comprovação falha.
  primeira.catch(()=>avisar());
  let segunda;
  try {
    await sinal;
    assert.ok(primeiraId,'A precisa registrar antes de B');
    const pid=(await b`select pg_backend_pid() as pid`)[0].pid;
    segunda=b.begin(async tx=>{await tx`set local role service_role`;return (await registrar(tx))[0].id;});
    segunda.catch(()=>{});
    let bloqueada=false;
    const prazo=Date.now()+5000;
    while(Date.now()<prazo) {
      const [estado]=await admin`select wait_event_type,wait_event from pg_stat_activity where pid=${pid}`;
      if(estado?.wait_event_type==='Lock' && estado.wait_event==='advisory') {bloqueada=true;break;}
      await new Promise(resolve=>setTimeout(resolve,25));
    }
    assert.ok(bloqueada,'B deve disputar o mesmo advisory lock em conexão independente');
  } finally {liberar();}
  const [idA,idB]=await Promise.all([primeira,segunda]);
  assert.equal(idA,idB);
  const [contagem]=await admin`select (select count(*)::int from private.tentativas_pagamento_teste) as tentativas,
    (select count(*)::int from private.eventos_tentativa_pagamento_teste) as eventos`;
  assert.deepEqual({...contagem},{tentativas:1,eventos:1});
  await assert.rejects(b.begin(async tx=>{await tx`set local role service_role`;
    return tx`select private.registrar_tentativa_inerte(${preparacaoSalva.id}::uuid,${randomUUID()}::uuid)`;}));
  const [final]=await admin`select count(*)::int as n,bool_and(not pagamento_habilitado and not repasse_habilitado and pago_centavos=0 and devolvido_centavos=0) as inerte from private.tentativas_pagamento_teste`;
  assert.equal(final.n,1);assert.equal(final.inerte,true);
  console.log('APROVADO: PostgreSQL real, duas conexões em disputa comprovada, um UUID, uma tentativa/evento, chave divergente recusada. Banco descartável; nenhum Supabase acessado.');
} finally {await Promise.all([a.end({timeout:1}),b.end({timeout:1}),admin.end({timeout:1})]);}
