import test from 'node:test';
import assert from 'node:assert/strict';
import {classificarFalhaRegistro} from '../server/preparar-pagamento.js';
test('diagnóstico do registro retorna somente categorias fixas sem dados do erro',()=>{
 const segredo='postgres://usuario:segredo@host/privado';
 for (const [erro,esperado] of [
 [{code:'42501',message:segredo},'42501'],
 [{message:'certificate UnknownIssuer '+segredo},'TLS'],
 [{message:'Banco de homologação não configurado. '+segredo},'CONFIGURACAO'],
 [{code:segredo,message:segredo},'OUTRA'],
 [{message:'connect ECONNREFUSED '+segredo},'CONEXAO']
 ]) assert.equal(classificarFalhaRegistro(erro),esperado);
});
