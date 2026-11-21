// Adaptador exclusivamente interno para registrar uma tentativa INERTE na homologação.
// A chave deve ser gerada pelo servidor e persistida/reutilizada para a mesma operação.
// Não disponibilizar como rota pública, não criar checkout e não habilitar repasses.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function criarRegistradorTentativaInerte({ambiente, banco}) {
  if (ambiente !== 'teste' || !banco || typeof banco.begin !== 'function') {
    throw new Error('Registro disponível somente no servidor de homologação.');
  }
  return Object.freeze({
    async registrar({preparacaoId, chaveIdempotencia}) {
      if (!uuid.test(preparacaoId || '') || !uuid.test(chaveIdempotencia || '')) {
        throw new Error('Identificadores inválidos.');
      }
      try {
        return await banco.begin(async tx => {
          await tx`set local role service_role`;
          const linhas = await tx`select private.registrar_tentativa_inerte(
            ${preparacaoId}::uuid, ${chaveIdempotencia}::uuid
          ) as id`;
          if (linhas.length !== 1 || !uuid.test(linhas[0]?.id || '')) {
            throw new Error('Registro não confirmado.');
          }
          return Object.freeze({tentativaId: linhas[0].id, pagamentoHabilitado:false, repasseHabilitado:false});
        });
      } catch {
        // Resultado incerto: não gerar nova chave nem tentar automaticamente.
        throw new Error('Não foi possível confirmar a tentativa de teste.');
      }
    },
  });
}
