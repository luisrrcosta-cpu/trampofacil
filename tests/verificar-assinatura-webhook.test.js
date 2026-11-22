import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync, sign} from 'node:crypto';
import {verificarAssinaturaWebhook as validar} from '../server/verificar-assinatura-webhook.js';
const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const chave=publicKey.export({format:'der',type:'spki'}).toString('base64');
const corpo=Buffer.from('{"id":"CHAR_TESTE-1","status":"WAITING"}');
const assinatura=sign('sha256',corpo,privateKey).toString('base64');
test('assinatura ECDSA válida',()=>assert.equal(validar({corpoBruto:corpo,cabecalhoAssinatura:assinatura,chavePublicaBase64:chave}),true));
test('rejeita corpo adulterado',()=>assert.equal(validar({corpoBruto:Buffer.from(corpo.toString()+' '),cabecalhoAssinatura:assinatura,chavePublicaBase64:chave}),false));
test('rejeita assinatura ausente',()=>assert.equal(validar({corpoBruto:corpo,chavePublicaBase64:chave}),false));
test('aceita uma assinatura válida entre várias',()=>assert.equal(validar({corpoBruto:corpo,cabecalhoAssinatura:'YWJjZA==,'+assinatura,chavePublicaBase64:chave}),true));
test('rejeita chave pública errada',()=>{const outro=generateKeyPairSync('ec',{namedCurve:'prime256v1'}).publicKey.export({format:'der',type:'spki'}).toString('base64');assert.equal(validar({corpoBruto:corpo,cabecalhoAssinatura:assinatura,chavePublicaBase64:outro}),false)});
test('rejeita chave RSA',()=>{const rsa=generateKeyPairSync('rsa',{modulusLength:2048}).publicKey.export({format:'der',type:'spki'}).toString('base64');assert.equal(validar({corpoBruto:corpo,cabecalhoAssinatura:assinatura,chavePublicaBase64:rsa}),false)});
test('rejeita corpo grande',()=>assert.equal(validar({corpoBruto:Buffer.alloc(262145),cabecalhoAssinatura:assinatura,chavePublicaBase64:chave}),false));

test('rejeita corpo vazio',()=>assert.equal(validar({corpoBruto:Buffer.alloc(0),cabecalhoAssinatura:assinatura,chavePublicaBase64:chave}),false));
test('rejeita assinatura com caracteres inválidos',()=>assert.equal(validar({corpoBruto:corpo,cabecalhoAssinatura:'@@@',chavePublicaBase64:chave}),false));
