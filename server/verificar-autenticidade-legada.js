import {createHash,timingSafeEqual} from 'node:crypto';

// Modelo legado documentado pelo PagBank: SHA256(token + '-' + corpo HTTP bruto).
// Verificação isolada; não cria cobranças, não atualiza dados e não libera repasses.
export function verificarAutenticidadeLegada({corpoBruto,cabecalhoAutenticidade,token}={}) {
  if (!Buffer.isBuffer(corpoBruto) || corpoBruto.length===0 || corpoBruto.length>262144 ||
      typeof token!=='string' || token.length<1 || token.length>4096 ||
      typeof cabecalhoAutenticidade!=='string' || !/^[a-fA-F0-9]{64}$/.test(cabecalhoAutenticidade)) return false;
  const calculado=createHash('sha256').update(token,'utf8').update('-','utf8').update(corpoBruto).digest();
  return timingSafeEqual(calculado,Buffer.from(cabecalhoAutenticidade,'hex'));
}
