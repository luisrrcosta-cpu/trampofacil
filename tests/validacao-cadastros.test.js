import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import {PGlite} from '@electric-sql/pglite';

const fonte=await readFile(new URL('../cadastro.js',import.meta.url),'utf8');
const trecho=fonte.slice(fonte.indexOf('function lerPerfil('),fonte.indexOf('function enviar('));
const contexto={FormData:class {constructor(dados){this.dados=dados;} get(chave){return this.dados[chave]??null;}}};
vm.runInNewContext(trecho,contexto);
const valido={nome:'João da Silva',cidade:'São João da Boa Vista',telefone:'(19) 99999-9999',email:'pessoa@example.invalid',servico:'Costura',descricao:'Reparos em roupas',tipo_prestador:'pessoa_fisica',tipo_atividade:'ocasional'};

test('interface rejeita dados incompletos, longos e caracteres de controle antes do envio',()=>{
  for(const campo of ['nome','cidade','servico']) {
    for(const valor of ['', 'a', 'a'.repeat(121), 'Ab\nCd']) {
      assert.throws(()=>contexto.lerPerfil({...valido,[campo]:valor},'profissional'));
    }
  }
  for(const email of ['', 'invalido', 'a@b', 'a @b.com','a'.repeat(250)+'@b.com']) {
    assert.throws(()=>contexto.lerPerfil({...valido,email},'profissional'),/e-mail/);
  }
  assert.throws(()=>contexto.lerPerfil({...valido,descricao:'a'.repeat(1001)},'profissional'),/descrição/);
  assert.throws(()=>contexto.lerPerfil({...valido,tipo_prestador:null},'profissional'),/pessoa física/);
  assert.throws(()=>contexto.lerPerfil({...valido,tipo_atividade:'admin'},'profissional'),/regular ou ocasional/);
  assert.throws(()=>contexto.lerPerfil({...valido,telefone:'123'},'cliente'),/WhatsApp/);
  const {perfil}=contexto.lerPerfil({...valido,email:' PESSOA@EXAMPLE.INVALID '},'cliente');
  assert.equal(perfil.email,'pessoa@example.invalid'); assert.equal(perfil.telefone,'19999999999');
  assert.equal(perfil.tipo_prestador,undefined);
});

test('cadastro aceita exemplos válidos de cliente e profissional',()=>{
  const profissional=contexto.lerPerfil({...valido},'profissional');
  assert.equal(profissional.perfil.tipo_prestador,'pessoa_fisica');
  assert.equal(profissional.perfil.tipo_atividade,'ocasional');
  assert.equal(profissional.perfil.telefone,'19999999999');
  const cliente=contexto.lerPerfil({...valido,email:'cliente.teste+2@example.com'},'cliente');
  assert.equal(cliente.perfil.email,'cliente.teste+2@example.com');
  assert.equal(cliente.perfil.telefone,'19999999999');
});

test('cadastro contempla CPF, MEI e empresa em atividade regular ou ocasional',()=>{
  for (const tipo_prestador of ['pessoa_fisica','mei','empresa']) {
    for (const tipo_atividade of ['regular','ocasional']) {
      const resultado=contexto.lerPerfil({...valido,tipo_prestador,tipo_atividade},'profissional');
      assert.equal(resultado.perfil.tipo_prestador,tipo_prestador);
      assert.equal(resultado.perfil.tipo_atividade,tipo_atividade);
      assert.equal(resultado.perfil.nome,'João da Silva');
    }
  }
});

test('edição profissional não exige o campo de e-mail oculto',()=>{
  const resultado=contexto.lerPerfil({...valido,email:''},'profissional',false);
  assert.equal(resultado.perfil.tipo_prestador,'pessoa_fisica');
  assert.equal(resultado.perfil.email,undefined);
});

test('banco impede gravações diretas inválidas sem modificar registros existentes',async t=>{
  const db=new PGlite();t.after(()=>db.close());
  await db.exec(`
    create table clientes(id int primary key,nome text,cidade text,telefone text,email text);
    create table profissionais(id int primary key,nome text,cidade text,telefone text,servico text,descricao text);
    insert into clientes values(1,'João da Silva','São João da Boa Vista','19999999999','pessoa@example.invalid');
    insert into profissionais values(1,'João da Silva','São João da Boa Vista','19999999999','Costura',null);
  `);
  const antes=await db.query('select * from clientes');
  await db.exec(await readFile(new URL('../supabase/homologacao/validar_conteudo_cadastros.sql',import.meta.url),'utf8'));
  assert.deepEqual((await db.query('select * from clientes')).rows,antes.rows);
  for(const tabela of ['clientes','profissionais']) {
    for(const campo of ['nome','cidade','telefone']) {
      const invalidos=campo==='telefone'?[null,'123','(19) 99999-9999']: [null,' ','a'.repeat(121),'Ab\nCd'];
      for(const valor of invalidos) await assert.rejects(db.query('update '+tabela+' set '+campo+'=$1 where id=1',[valor]),/check constraint/);
    }
  }
  for(const email of [null,'a@b','a @b.com','a'.repeat(250)+'@b.com'])
    await assert.rejects(db.query('update clientes set email=$1 where id=1',[email]),/check constraint/);
  await assert.rejects(db.query('update profissionais set descricao=$1',['a'.repeat(1001)]),/check constraint/);
  await assert.rejects(db.exec("update profissionais set servico=''"),/check constraint/);
  // Regressão: as expressões SQL devem aceitar formatos reais já aceitos pelo formulário.
  // Impede que um escape extra transforme \+ e \. em validações incorretas.
  for (const telefone of ['19999999999', '+5519999999999']) {
    await db.query('update clientes set telefone=$1 where id=1',[telefone]);
    await db.query('update profissionais set telefone=$1 where id=1',[telefone]);
  }
  for (const email of ['pessoa@example.invalid', 'cliente.teste+2@example.com']) {
    await db.query('update clientes set email=$1 where id=1',[email]);
  }
  await db.exec("update profissionais set descricao='Primeira linha'||chr(10)||'Segunda linha'");
  assert.equal((await db.query("select count(*)::int as n from pg_constraint where conname like '%_conteudo_check' and convalidated")).rows[0].n,9);
});
