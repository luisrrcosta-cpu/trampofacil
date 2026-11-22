import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const destino=process.argv[2];
if(!destino)throw new Error('Informe a pasta de saída da interface.');
const html=await readFile(resolve(raiz,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script\s+src="([^"]+)"\s+defer><\/script>/g)].map(m=>m[1]);
if(!scripts.length||scripts.some(s=>!/^[-a-z0-9]+\.js$/.test(s)))throw new Error('Lista de scripts inválida.');
const pasta=resolve(destino);
await mkdir(pasta,{recursive:true});
const arquivos=['index.html',...scripts,'login-teste.html','login-teste.js','login-teste-core.js','login-teste.css'];
for(const arquivo of arquivos)await writeFile(resolve(pasta,arquivo),await readFile(resolve(raiz,arquivo)));
console.log(JSON.stringify({directory:pasta,files:arquivos}));
