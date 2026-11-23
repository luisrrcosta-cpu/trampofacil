import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('fila administrativa exclui publicados, prioriza pedidos antigos e identifica cadastro incompleto sem alterar dados',async t=>{
  const db=new PGlite();t.after(()=>db.close());
  await db.exec(`
    create table profissionais(usuario_id int primary key,nome text,cidade text,servico text,tipo_prestador text,tipo_atividade text,publicado boolean);
    create table solicitacoes_analise_profissional(usuario_id int primary key,estado text,criado_em timestamptz);
    insert into profissionais values
      (1,'Pessoa A','Cidade','Costura','pessoa_fisica','ocasional',false),
      (2,'Pessoa B','Cidade','Pintura','mei','regular',true),
      (3,'Pessoa C','Cidade','Limpeza',null,null,false),
      (4,'Pessoa D','Cidade','Montagem','empresa','regular',false);
    insert into solicitacoes_analise_profissional values
      (1,'aguardando_analise','2026-11-23T12:00:00Z'),
      (2,'aguardando_analise','2026-11-22T12:00:00Z'),
      (3,'aguardando_analise','2026-11-23T11:00:00Z');
  `);
  const sql=await readFile(new URL('../supabase/homologacao/consultar_fila_analise.sql',import.meta.url),'utf8');
  const before=(await db.query('select * from profissionais order by usuario_id')).rows;
  const rows=(await db.query(sql)).rows;
  assert.deepEqual(rows.map(r=>r.usuario_id),[3,1]);
  assert.equal(rows[0].situacao_revisao,'cadastro_incompleto');
  assert.equal(rows[1].situacao_revisao,'aguardando_revisao');
  assert.equal(Object.hasOwn(rows[0],'telefone'),false);
  assert.deepEqual((await db.query('select * from profissionais order by usuario_id')).rows,before);
  assert.equal((await db.query('select count(*)::int as n from solicitacoes_analise_profissional')).rows[0].n,3);
});
