// Somente SELECT, em transação read only. O filtro de proprietário faz parte da consulta.
export function criarLeituraEstadoCheckout(banco) {
 if(typeof banco?.begin!=='function')throw Error('Banco indisponível.');
 return ({preparacaoId,usuarioId})=>banco.begin(async tx=>{
  await tx`set transaction read only`;
  await tx`set local role service_role`;
  const rows=await tx`select p.id as preparacao_id,p.cliente_usuario_id,
    case when c.preparacao_id is null then 'nao_iniciado' when c.usuario_id=p.cliente_usuario_id then c.estado else 'invalido' end as estado,
    coalesce(c.pagamento_real_habilitado,false) as pagamento_real_habilitado,
    coalesce(c.repasse_habilitado,false) as repasse_habilitado
    from private.preparacoes_pagamento p
    left join private.checkouts_pagbank_sandbox c on c.preparacao_id=p.id
    where p.id=${preparacaoId}::uuid and p.cliente_usuario_id=${usuarioId}::uuid`;
  if(rows.length>1)throw Error('Consulta indisponível.');return rows[0]??null;
 });
}
