import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import postgres from 'postgres';

// Mesmo banco descartável do job financeiro. Nunca aceita host Supabase.
const url=new URL(process.env.TRAMPOFACIL_PG_CONCURRENCY_URL || 'http://invalido');
assert.ok(url.protocol==='postgres:' && ['127.0.0.1','localhost'].includes(url.hostname) &&
  url.pathname==='/trampofacil_concorrencia_test' && !url.search && !url.hash,
  'Use somente PostgreSQL descartável em loopback.');
const options={max:1,prepare:false,connect_timeout:5,connection:{statement_timeout:10000,lock_timeout:7000}};
const admin=postgres(url.href,options),a=postgres(url.href,options),b=postgres(url.href,options);
try {
  assert.equal((await admin`select current_database() as nome`)[0].nome,'trampofacil_concorrencia_test');
  assert.equal((await admin`select to_regclass('public.profissionais') as tabela`)[0].tabela,null,
    'O teste exige ausência de perfis; não reutilizar banco com dados da aplicação.');
  await admin.unsafe(`
    grant usage on schema auth to authenticated;
    create function auth.jwt() returns jsonb language sql stable as
      $$select current_setting('request.jwt.claims',true)::jsonb$$;
    create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
    create table public.profissionais(usuario_id uuid primary key references auth.users(id),
      nome text,cidade text,servico text,descricao text,tipo_prestador text,tipo_atividade text,
      publicado boolean not null default false,pausado boolean not null default true);
    alter table public.profissionais enable row level security;
    grant select on public.profissionais to authenticated;
    grant update(nome,descricao) on public.profissionais to authenticated;
    create policy titular_leitura on public.profissionais for select to authenticated using(usuario_id=auth.uid());
    create policy titular_edicao on public.profissionais for update to authenticated
      using(usuario_id=auth.uid()) with check(usuario_id=auth.uid());
    create table public.solicitacoes_analise_profissional(usuario_id uuid primary key references public.profissionais(usuario_id),
      estado text not null default 'aguardando_analise',criado_em timestamptz not null default now());
  `);
  for(const file of ['estrutura_interna_revisao_perfis.sql','painel_revisao_perfis.sql','reavaliar_publicacao_profissional.sql','recusa_publicacao_perfil.sql'])
    await admin.unsafe(await readFile(new URL('../supabase/homologacao/'+file,import.meta.url),'utf8'));
  const revisor=randomUUID(),alvos=Array.from({length:11},()=>randomUUID());
  await admin`insert into auth.users(id) values(${revisor})`;
  await admin`insert into private.revisores_perfil(usuario_id) values(${revisor})`;
  for(const alvo of alvos){
    await admin`insert into auth.users(id) values(${alvo})`;
    await admin`insert into public.profissionais(usuario_id,nome,cidade,servico,descricao,tipo_prestador,tipo_atividade)
      values(${alvo},'Perfil teste','Cidade','Costura','Inicial','pessoa_fisica','ocasional')`;
    await admin`insert into public.solicitacoes_analise_profissional(usuario_id) values(${alvo})`;
  }
  const snapshot={nome:'Perfil teste',cidade:'Cidade',servico:'Costura',descricao:'Inicial',tipo_prestador:'pessoa_fisica',tipo_atividade:'ocasional'};
  const assumir=async(tx,usuario)=>{
    await tx`set local role authenticated`;
    await tx`select set_config('request.jwt.claims',${JSON.stringify({sub:usuario,is_anonymous:false})},true)`;
  };
  const aprovar=async(tx,alvo)=>{
    await assumir(tx,revisor);
    return (await tx`select public.aprovar_perfil_administrativo(${alvo}::uuid,${tx.json(snapshot)}) as id`)[0].id;
  };
  // B deve estar realmente bloqueada em outra conexão, não apenas iniciada depois de A.
  async function disputar(acaoA,acaoB){
    let liberar,avisar,pronta=false,segunda;
    const sinal=new Promise(resolve=>{avisar=resolve;});
    const barreira=new Promise(resolve=>{liberar=resolve;});
    const primeira=a.begin(async tx=>{
      const resultado=await acaoA(tx);pronta=true;avisar();await barreira;return resultado;
    });
    primeira.catch(()=>avisar());
    try{
      await sinal;
      assert.ok(pronta,'A precisa adquirir o lock antes de iniciar B');
      const pid=(await b`select pg_backend_pid() as pid`)[0].pid;
      segunda=b.begin(acaoB);segunda.catch(()=>{});
      let bloqueada=false;
      const prazo=Date.now()+5000;
      while(Date.now()<prazo){
        const [estado]=await admin`select wait_event_type from pg_stat_activity where pid=${pid}`;
        if(estado?.wait_event_type==='Lock'){bloqueada=true;break;}
        await new Promise(resolve=>setTimeout(resolve,25));
      }
      assert.ok(bloqueada,'B precisa disputar um lock de linha em conexão independente');
    } catch(error){
      liberar();
      await Promise.allSettled([primeira,segunda]);
      throw error;
    } finally {liberar();}
    return Promise.allSettled([primeira,segunda]);
  }
  const duplicadas=await disputar(tx=>aprovar(tx,alvos[0]),tx=>aprovar(tx,alvos[0]));
  assert.ok(duplicadas.every(r=>r.status==='fulfilled'));
  assert.equal(duplicadas[0].value,duplicadas[1].value);
  assert.equal((await admin`select count(*)::int as n from private.aprovacoes_perfil where profissional_usuario_id=${alvos[0]}`)[0].n,1);

  const edicaoPrimeiro=await disputar(async tx=>{
    await assumir(tx,alvos[1]);
    return tx`update public.profissionais set descricao='Alterado durante análise' where usuario_id=${alvos[1]}`;
  },tx=>aprovar(tx,alvos[1]));
  assert.equal(edicaoPrimeiro[0].status,'fulfilled');
  assert.equal(edicaoPrimeiro[1].status,'rejected');
  assert.equal(edicaoPrimeiro[1].reason.code,'40001');
  assert.equal((await admin`select publicado from public.profissionais where usuario_id=${alvos[1]}`)[0].publicado,false);

  const aprovacaoPrimeiro=await disputar(tx=>aprovar(tx,alvos[2]),async tx=>{
    await assumir(tx,alvos[2]);
    return tx`update public.profissionais set descricao='Mudança após aprovação' where usuario_id=${alvos[2]}`;
  });
  assert.ok(aprovacaoPrimeiro.every(r=>r.status==='fulfilled'));
  const [perfil]=await admin`select publicado,pausado,descricao from public.profissionais where usuario_id=${alvos[2]}`;
  assert.deepEqual({...perfil},{publicado:false,pausado:true,descricao:'Mudança após aprovação'});


  const recusar=async(tx,alvo,motivo='servico_nao_identificavel')=>{
    await assumir(tx,revisor);
    return (await tx`select public.recusar_publicacao_perfil(${alvo}::uuid,${tx.json(snapshot)},${motivo}) as id`)[0].id;
  };
  const recusasDuplicadas=await disputar(tx=>recusar(tx,alvos[4]),tx=>recusar(tx,alvos[4]));
  assert.ok(recusasDuplicadas.every(r=>r.status==='fulfilled'));
  assert.equal(recusasDuplicadas[0].value,recusasDuplicadas[1].value);
  assert.equal((await admin`select count(*)::int as n from private.recusas_publicacao_perfil where profissional_usuario_id=${alvos[4]}`)[0].n,1);

  const edicaoAntesRecusa=await disputar(async tx=>{
    await assumir(tx,alvos[5]);
    return tx`update public.profissionais set descricao='Corrigida durante recusa' where usuario_id=${alvos[5]}`;
  },tx=>recusar(tx,alvos[5]));
  assert.equal(edicaoAntesRecusa[0].status,'fulfilled');
  assert.equal(edicaoAntesRecusa[1].status,'rejected');
  assert.equal(edicaoAntesRecusa[1].reason.code,'40001');

  const aprovacaoAntesRecusa=await disputar(tx=>aprovar(tx,alvos[6]),tx=>recusar(tx,alvos[6]));
  assert.equal(aprovacaoAntesRecusa[0].status,'fulfilled');
  assert.equal(aprovacaoAntesRecusa[1].status,'rejected');
  assert.equal(aprovacaoAntesRecusa[1].reason.code,'22023');

  const recusaAntesAprovacao=await disputar(tx=>recusar(tx,alvos[7]),tx=>aprovar(tx,alvos[7]));
  assert.ok(recusaAntesAprovacao.every(r=>r.status==='fulfilled'));
  assert.equal((await admin`select publicado from public.profissionais where usuario_id=${alvos[7]}`)[0].publicado,true);
  assert.equal((await admin`select count(*)::int as n from private.recusas_publicacao_perfil where profissional_usuario_id=${alvos[7]}`)[0].n,1);


  const recusaAntesEdicao=await disputar(tx=>recusar(tx,alvos[8]),async tx=>{
    await assumir(tx,alvos[8]);
    return tx`update public.profissionais set descricao='Correção após decisão' where usuario_id=${alvos[8]}`;
  });
  assert.ok(recusaAntesEdicao.every(r=>r.status==='fulfilled'));
  await a.begin(async tx=>{
    await assumir(tx,alvos[8]);
    const [resposta]=await tx`select public.consultar_recusa_publicacao() as recusas`;
    assert.equal(resposta.recusas[0].perfil_alterado,true);
  });
  const [corrigido]=await admin`select publicado,pausado,descricao from public.profissionais where usuario_id=${alvos[8]}`;
  assert.deepEqual({...corrigido},{publicado:false,pausado:true,descricao:'Correção após decisão'});

  const motivosDiferentes=await disputar(tx=>recusar(tx,alvos[9]),tx=>recusar(tx,alvos[9],'informacoes_inconsistentes'));
  assert.ok(motivosDiferentes.every(r=>r.status==='fulfilled'));
  assert.notEqual(motivosDiferentes[0].value,motivosDiferentes[1].value);
  await a.begin(async tx=>{
    await assumir(tx,alvos[9]);
    const [resposta]=await tx`select public.consultar_recusa_publicacao() as recusas`;
    assert.equal(resposta.recusas[0].motivo,'informacoes_inconsistentes');
  });
  const novaDecisao=await a.begin(tx=>recusar(tx,alvos[9]));
  assert.notEqual(novaDecisao,motivosDiferentes[0].value,'voltar ao motivo antigo deve registrar uma nova decisão');
  assert.equal((await a.begin(tx=>recusar(tx,alvos[9]))),novaDecisao);
  assert.equal((await admin`select count(*)::int as n from private.recusas_publicacao_perfil where profissional_usuario_id=${alvos[9]}`)[0].n,3);

  const revogacao=await disputar(tx=>tx`update private.revisores_perfil set ativo=false where usuario_id=${revisor}`,
    tx=>aprovar(tx,alvos[3]));
  assert.equal(revogacao[0].status,'fulfilled');
  assert.equal(revogacao[1].status,'rejected');
  assert.equal(revogacao[1].reason.code,'42501');
  assert.equal((await admin`select count(*)::int as n from private.aprovacoes_perfil`)[0].n,4);
  assert.equal((await admin`select count(*)::int as n from private.eventos_revisores_perfil`)[0].n,2);

  await admin`update private.revisores_perfil set ativo=true where usuario_id=${revisor}`;
  const revogacaoRecusa=await disputar(tx=>tx`update private.revisores_perfil set ativo=false where usuario_id=${revisor}`,
    tx=>recusar(tx,alvos[10]));
  assert.equal(revogacaoRecusa[0].status,'fulfilled');
  assert.equal(revogacaoRecusa[1].status,'rejected');
  assert.equal(revogacaoRecusa[1].reason.code,'42501');
  assert.equal((await admin`select count(*)::int as n from private.recusas_publicacao_perfil where profissional_usuario_id=${alvos[10]}`)[0].n,0);
  assert.equal((await admin`select count(*)::int as n from private.eventos_revisores_perfil`)[0].n,4);
  console.log('APROVADO: disputa real comprovada em onze cenários de revisão: aprovação duplicada, edição antes/depois, revogação, recusa duplicada, edição durante recusa e decisão concorrente nos dois sentidos, edição após recusa, motivos concorrentes e revogação antes da recusa. PostgreSQL descartável; nenhum Supabase acessado.');
} finally {await Promise.all([a.end({timeout:1}),b.end({timeout:1}),admin.end({timeout:1})]);}
