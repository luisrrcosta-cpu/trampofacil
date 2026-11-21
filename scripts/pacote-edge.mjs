import {readFile} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export async function prepararPacoteEdge() {
  const entrada='supabase/functions/preparar-pagamento-teste/index.ts';
  const arquivos=new Map();
  async function incluir(nome) {
    if(arquivos.has(nome)) return;
    if(!/^(server\/[a-z-]+\.js|supabase\/functions\/preparar-pagamento-teste\/(index\.ts|deno\.json))$/.test(nome)) throw Error('Arquivo fora do pacote permitido.');
    const content=await readFile(resolve(raiz,nome),'utf8');
    arquivos.set(nome,{name:nome,content});
    for(const m of content.matchAll(/^import\s+.*?from\s+['"]([^'"]+)['"]/gm)) {
      const alvo=m[1];
      if(alvo==='npm:postgres@4.1.1') continue;
      if(!alvo.startsWith('.')) throw Error('Dependência externa não revisada.');
      await incluir(relative(raiz,resolve(raiz,dirname(nome),alvo)));
    }
  }
  await incluir(entrada);
  await incluir('supabase/functions/preparar-pagamento-teste/deno.json');
  return {entrypoint_path:entrada,files:[...arquivos.values()]};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const pacote=await prepararPacoteEdge();
  // Apenas inventário; nenhum segredo ou implantação automática.
  console.log(JSON.stringify({entrypoint:pacote.entrypoint_path,files:pacote.files.map(f=>f.name)}));
}
