import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const edge=readFileSync(new URL('../server/edge-homologacao.js',import.meta.url),'utf8');
const inerte=readFileSync(new URL('../server/registrar-tentativa-inerte.js',import.meta.url),'utf8');

test('Edge fixa o projeto de homologação e não contém identificador da produção',()=>{
  assert.match(edge,/projetoHomologacao\s*=\s*'asdszqtpydiowgerxwee'/);
  assert.doesNotMatch(edge,/flropneedvaimzcmvcza/);
  assert.match(edge,/supabaseUrl\s*!==\s*urlHomologacao/);
});
test('Edge só expõe rota de preparação, sem rota pública para tentativas',()=>{
  assert.match(edge,/\/functions\/v1\/\$\{nomeFuncaoPreparacao\}/);
  assert.match(edge,/void registrarTentativaInterna/);
  assert.doesNotMatch(edge,/\/api\/pagamentos\/cobrar/);
});
test('tentativa inerte não habilita pagamento nem repasse',()=>{
  assert.match(inerte,/ambiente\s*!==\s*'teste'/);
  assert.match(inerte,/pagamentoHabilitado:false/);
  assert.match(inerte,/repasseHabilitado:false/);
});
