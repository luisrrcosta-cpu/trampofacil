// Preparação pura de rascunho. Não autentica, assina, publica ou movimenta dinheiro.
const campos = [
  'solicitacao_id', 'cliente_usuario_id', 'profissional_usuario_id', 'versao_minuta',
  'escopo', 'materiais_descricao', 'mao_obra_centavos', 'materiais_centavos',
  'total_centavos', 'inicio_previsto', 'fim_previsto', 'condicoes',
];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function identificador(valor) {
  if (typeof valor !== 'string' || !uuid.test(valor)) throw new Error('Identificador inválido.');
  return valor.toLowerCase();
}
function texto(valor, minimo, maximo) {
  if (typeof valor !== 'string') throw new Error('Texto obrigatório.');
  const normal = valor.replace(/\r\n?/g, '\n').normalize('NFC').trim();
  const tamanho = Array.from(normal).length;
  if (tamanho < minimo || tamanho > maximo || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/.test(normal)) {
    throw new Error('Texto inválido.');
  }
  return normal;
}
function centavos(valor) {
  if (!Number.isSafeInteger(valor) || valor < 0 || valor > 100000000) throw new Error('Valor inválido em centavos.');
  return valor;
}
function dataCivil(valor) {
  if (typeof valor !== 'string' || !/^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(valor)) throw new Error('Data inválida.');
  const instante = new Date(valor + 'T00:00:00.000Z');
  if (!Number.isFinite(instante.valueOf()) || instante.toISOString().slice(0,10) !== valor) throw new Error('Data inválida.');
  return valor;
}
export function prepararRascunhoContrato(entrada) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada) ||
      Object.keys(entrada).length !== campos.length ||
      !campos.every(c => Object.prototype.hasOwnProperty.call(entrada,c))) throw new Error('Estrutura contratual inválida.');
  const solicitacao = identificador(entrada.solicitacao_id);
  const cliente = identificador(entrada.cliente_usuario_id);
  const profissional = identificador(entrada.profissional_usuario_id);
  if (cliente === profissional) throw new Error('As partes devem ser distintas.');
  if (typeof entrada.versao_minuta !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(entrada.versao_minuta)) throw new Error('Versão da minuta inválida.');
  const maoObra = centavos(entrada.mao_obra_centavos);
  const materiais = centavos(entrada.materiais_centavos);
  const total = centavos(entrada.total_centavos);
  if (total < 100 || maoObra + materiais !== total) throw new Error('A soma de mão de obra e materiais deve corresponder ao total.');
  const inicio = dataCivil(entrada.inicio_previsto);
  const fim = dataCivil(entrada.fim_previsto);
  if (fim < inicio) throw new Error('Fim previsto anterior ao início.');
  // Ordem explícita e versão de formato: serialização determinística deste rascunho.
  // A versão de minuta ainda precisa ser conferida em um registro confiável no servidor.
  return Object.freeze({
    formato: 'trampofacil.contrato-rascunho.v1',
    solicitacao_id: solicitacao, cliente_usuario_id: cliente, profissional_usuario_id: profissional,
    versao_minuta: entrada.versao_minuta,
    escopo: texto(entrada.escopo,10,3000),
    materiais_descricao: texto(entrada.materiais_descricao,2,2000),
    mao_obra_centavos: maoObra, materiais_centavos: materiais, total_centavos: total,
    inicio_previsto: inicio, fim_previsto: fim,
    condicoes: texto(entrada.condicoes,10,3000),
  });
}
export function serializarRascunhoContrato(entrada) {
  return JSON.stringify(prepararRascunhoContrato(entrada));
}
