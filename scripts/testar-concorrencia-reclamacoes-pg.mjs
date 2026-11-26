import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import postgres from 'postgres';
const url=new URL(process.env.TRAMPOFACIL_PG_CONCURRENCY_URL||'http://invalido');
assert.ok(url.protocol==='postgres:'&&['127.0.0.1','localhost'].includes(url.hostname)&&url.pathname==='/trampofacil_concorrencia_test'&&!url.search&&!url.hash,'Somente PostgreSQL descartável em loopback.');
const options={max:1,prepare:false,connect_timeout:5,connection:{statement_timeout:10000,lock_timeout:7000}};
const admin=postgres(url.href,options),a=postgres(url.href,options),b=postgres(url.href,options);
try{
 assert.equal((await admin`select current_database() as nome`)[0].nome,'trampofacil_concorrencia_test');
 assert.equal((await admin`select to_regclass('public.acompanhamento_reclamacoes') as tabela`)[0].tabela,null);
 await admin.unsafe(`alter table public.solicitacoes add column titulo text not null default 'Pedido fictício';
 grant select on public.solicitacoes to authenticated;
 create policy partes_reclamacao on public.solicitacoes for select to authenticated using(auth.uid() in(cliente_usuario_id,profissional_usuario_id));`);
 for(const f of ['20261126214707_reclamacoes_servico_homologacao.sql','20261126220117_acompanhamento_reclamacoes_homologacao.sql'])await admin.unsafe(await readFile(new URL('../supabase/migrations/'+f,import.meta.url),'utf8'));
 const revisor=randomUUID(),cliente=randomUUID(),prof=randomUUID(),pedidos=Array.from({length:3},()=>randomUUID());
 await admin`insert into auth.users(id) values(${revisor}),(${cliente}),(${prof})`;
 await admin`insert into private.revisores_perfil(usuario_id) values(${revisor})`;
 for(const id of pedidos){await admin`insert into public.solicitacoes(id,cliente_usuario_id,profissional_usuario_id,status,valor_centavos,atualizado_em) values(${id},${cliente},${prof},'concluida',10000,now())`;await admin`insert into public.reclamacoes_servico(solicitacao_id,cliente_usuario_id,motivo,descricao) values(${id},${cliente},'qualidade','Relato inicial fictício para teste.')`;}
 const atualizar=async(tx,pedido,operacao)=>{await tx`set local role authenticated`;await tx`select set_config('request.jwt.claims',${JSON.stringify({sub:revisor,is_anonymous:false})},true)`;return(await tx`select atualizar_acompanhamento_reclamacao(${pedido}::uuid,${operacao}::uuid,0,'em_analise','Análise inicial do atendimento fictício.') as resultado`)[0].resultado;};
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

 const mesma=randomUUID();const duplicadas=await disputar(tx=>atualizar(tx,pedidos[0],mesma),tx=>atualizar(tx,pedidos[0],mesma));
 assert.ok(duplicadas.every(r=>r.status==='fulfilled'));assert.deepEqual(duplicadas[0].value,duplicadas[1].value);
 assert.equal((await admin`select count(*)::int as n from acompanhamento_reclamacoes where solicitacao_id=${pedidos[0]}`)[0].n,1);
 const concorrentes=await disputar(tx=>atualizar(tx,pedidos[1],randomUUID()),tx=>atualizar(tx,pedidos[1],randomUUID()));
 assert.equal(concorrentes[0].status,'fulfilled');assert.equal(concorrentes[1].status,'rejected');assert.equal(concorrentes[1].reason.code,'40001');
 const revogada=await disputar(tx=>tx`update private.revisores_perfil set ativo=false where usuario_id=${revisor}`,tx=>atualizar(tx,pedidos[2],randomUUID()));
 assert.equal(revogada[0].status,'fulfilled');assert.equal(revogada[1].status,'rejected');assert.equal(revogada[1].reason.code,'42501');
 assert.equal((await admin`select count(*)::int as n from acompanhamento_reclamacoes where solicitacao_id=${pedidos[2]}`)[0].n,0);
 console.log('Disputa real de reclamações aprovada: operação duplicada, atualização concorrente e revogação administrativa. Somente banco descartável.');
}finally{await Promise.all([a.end({timeout:1}),b.end({timeout:1}),admin.end({timeout:1})]);}
