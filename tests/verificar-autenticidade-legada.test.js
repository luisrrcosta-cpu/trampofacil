import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verificarAutenticidadeLegada} from '../server/verificar-autenticidade-legada.js';
const token='token-ficticio';
const corpoBruto=Buffer.from('{"id":"CHAR_TESTE","status":"WAITING"}');
const assinatura=createHash('sha256').update(token).update('-').update(corpoBruto).digest('hex');
test('aceita hash legítimo do corpo bruto',()=>assert.equal(verificarAutenticidadeLegada({corpoBruto,token,cabecalhoAutenticidade:assinatura}),true));
test('rejeita payload alterado',()=>assert.equal(verificarAutenticidadeLegada({corpoBruto:Buffer.from(corpoBruto.toString()+' '),token,cabecalhoAutenticidade:assinatura}),false));
test('rejeita token diferente',()=>assert.equal(verificarAutenticidadeLegada({corpoBruto,token:'outro-token',cabecalhoAutenticidade:assinatura}),false));
test('rejeita assinatura ausente ou malformada',()=>{
 for(const cabecalhoAutenticidade of [undefined,'','@@@','a'.repeat(63),'a'.repeat(65)])
  assert.equal(verificarAutenticidadeLegada({corpoBruto,token,cabecalhoAutenticidade}),false);
});
test('rejeita corpo ausente e não aceita string serializada',()=>{
 for(const corpo of [undefined,'{}',Buffer.alloc(0)])
  assert.equal(verificarAutenticidadeLegada({corpoBruto:corpo,token,cabecalhoAutenticidade:assinatura}),false);
});
