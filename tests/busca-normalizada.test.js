import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('busca normaliza acentos e espaços sem vazar perfis ocultos ou expandir curingas',async t=>{
  const db=new PGlite();t.after(()=>db.close());
  await db.exec(`
    create role anon;create role authenticated;
    create table catalogo_profissionais(id uuid primary key,nome text,cidade text,servico text,descricao text,ativo boolean);
    alter table catalogo_profissionais enable row level security;
    grant select on catalogo_profissionais to anon,authenticated;
    create policy ativos on catalogo_profissionais for select to anon,authenticated using(ativo);
  `);
  for(let n=1;n<=25;n++){
    const id='00000000-0000-4000-8000-'+String(n).padStart(12,'0');
    await db.query('insert into catalogo_profissionais values($1,$2,$3,$4,$5,$6)',[id,'Pessoa '+String(n).padStart(2,'0'),'São João da Boa Vista','Manutenção de móveis','Serviço fictício',n!==25]);
  }
  await db.exec(await readFile(new URL('../supabase/homologacao/busca_normalizada_profissionais.sql',import.meta.url),'utf8'));
  await db.exec('set role anon');
  const buscar=(s,c,p=0)=>db.query('select * from buscar_profissionais($1,$2,$3)',[s,c,p]);
  const primeira=(await buscar('MANUTENCAO   DE MOVEIS','  sao   joao da boa vista ')).rows;
  assert.equal(primeira.length,20);
  assert.deepEqual(Object.keys(primeira[0]).sort(),['cidade','descricao','id','nome','servico'].sort());
  assert.equal((await buscar('manutenção de móveis'.normalize('NFD'),'São João da Boa Vista'.normalize('NFD'))).rows.length,20);
  assert.equal((await buscar('Manutenção\u00a0de\u00a0móveis','São\tJoão\n da Boa Vista')).rows.length,20);
  const segunda=(await buscar('manutencao','sao joao',1)).rows;
  assert.equal(segunda.length,4);
  assert.equal(new Set([...primeira,...segunda].map(x=>x.id)).size,24);
  assert.equal((await buscar('%','')).rows.length,0);
  assert.equal((await buscar('_','')).rows.length,0);
  assert.equal((await buscar("' OR true --",'')).rows.length,0);
  assert.equal((await buscar('','outra cidade')).rows.length,0);
  assert.equal((await buscar(null,'')).rows.length,0);
  assert.equal((await buscar('','',-1)).rows.length,20);
  await db.exec('reset role');
  assert.equal((await db.query('select count(*)::int as n from catalogo_profissionais')).rows[0].n,25);
  assert.equal((await db.query("select prosecdef from pg_proc where proname='buscar_profissionais'")).rows[0].prosecdef,false);
});
