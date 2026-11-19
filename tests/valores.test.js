import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import test from 'node:test';

const converter = runInNewContext((await readFile(new URL('../valores.js',import.meta.url),'utf8'))+';propostaEmCentavos');

test('orçamento preserva centavos sem arredondamento',()=>{
  for(const [entrada,esperado] of [['1',100],['1.01',101],['19.99',1999],['150,50',15050],['150.5',15050],[' 120 ',12000],['999999.99',99999999],['1000000.00',100000000]]) {
    assert.equal(converter(entrada),esperado,entrada);
  }
});
test('orçamento rejeita valores inválidos ou ambíguos antes de enviar',()=>{
  for(const entrada of ['',null,NaN,150,'0','-1','0.99','1000000.01','1.005','1e3','1.500,00','1,500.00','Infinity','NaN','150 reais']) {
    assert.throws(()=>converter(entrada),undefined,String(entrada));
  }
});
