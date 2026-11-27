import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const codigo=await readFile(new URL('../cadastro.js',import.meta.url),'utf8');
const contexto=vm.createContext({});
vm.runInContext(codigo.slice(0,codigo.indexOf('const config =')),contexto);
const validar=(lista,principal='Pedreiro')=>JSON.parse(JSON.stringify(contexto.validarEspecialidades(lista,principal)));
test('especialidades normalizam espaços e Unicode sem alterar a profissão principal',()=>{
 assert.deepEqual(validar([' Pintor ','Te\u0301cnico']),['Pintor','Técnico']);
 assert.deepEqual(validar([]),[]);
 assert.equal(validar(Array.from({length:10},(_,i)=>'Especialidade '+i)).length,10);
});
test('especialidades rejeitam duplicidade, controles, tipo inválido e excesso',()=>{
 for(const valor of [null,{},['Pintor','pintor'],['Pedreiro'],['Técnico','Te\u0301cnico'],['a'],['a'.repeat(121)],['Pintor\n'],[null],Array.from({length:11},(_,i)=>'Especialidade '+i)])assert.throws(()=>validar(valor));
});
