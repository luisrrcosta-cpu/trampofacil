import test from 'node:test';
import assert from 'node:assert/strict';
import {prepararPacoteEdge} from '../scripts/pacote-edge.mjs';
test('pacote Edge inclui o adaptador interno e todas as dependências relativas sem frontend ou segredos',async()=>{
  const pacote=await prepararPacoteEdge();
  const nomes=pacote.files.map(f=>f.name);
  assert.ok(nomes.includes('server/registrar-tentativa-inerte.js'));
  assert.ok(nomes.includes('supabase/functions/preparar-pagamento-teste/deno.json'));
  assert.equal(nomes.length,new Set(nomes).size);
  assert.equal(nomes.length,7);
  assert.equal(pacote.entrypoint_path,'supabase/functions/preparar-pagamento-teste/index.ts');
  assert.ok(nomes.every(n=>n.startsWith('server/')||n.startsWith('supabase/functions/')));
  assert.ok(!nomes.some(n=>/config\.js|\.env|tests\//.test(n)));
});
