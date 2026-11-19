const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const projetoProducao='flropneedvaimzcmvcza';

export function criarAdaptadoresHomologacao({ambiente,projetoHomologacaoConfirmado,supabaseUrl,chavePublicavel,fetchImpl=globalThis.fetch,timeoutMs=15000}={}) {
  if(ambiente!=='teste'||projetoHomologacaoConfirmado!==true)throw new Error('Selecione e confirme um projeto de homologação.');
  let url;
  try{url=new URL(supabaseUrl);}catch{throw new Error('URL de homologação inválida.');}
  const projeto=/^([a-z0-9]{20})\.supabase\.co$/.exec(url.hostname)?.[1];
  if(!projeto||projeto===projetoProducao||url.protocol!=='https:'||url.port||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('Use exclusivamente a URL HTTPS de um projeto Supabase de homologação.');
  if(typeof chavePublicavel!=='string'||!/^sb_publishable_[A-Za-z0-9_-]{1,450}$/.test(chavePublicavel))throw new Error('Use somente uma chave publicável de homologação.');
  if(typeof fetchImpl!=='function'||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw new Error('Transporte inválido.');
  const tokenValido=token=>typeof token==='string'&&token.length<=8192&&/^[A-Za-z0-9._-]+$/.test(token);
  async function consultar(caminho,token){
    if(!tokenValido(token))throw new Error('Sessão inválida.');
    try{
      const resposta=await fetchImpl(url.origin+caminho,{
        method:'GET',headers:{apikey:chavePublicavel,Authorization:'Bearer '+token,Accept:'application/json'},
        credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(timeoutMs),
      });
      if(!resposta.ok)throw new Error();
      return await resposta.json();
    }catch{throw new Error('Não foi possível consultar a homologação.');}
  }
  return Object.freeze({
    async autenticar(token){
      // A identidade vem da resposta do Auth, não da decodificação local do JWT.
      const usuario=await consultar('/auth/v1/user',token);
      if(!uuid.test(usuario?.id||'')||usuario.is_anonymous!==false||!usuario.email_confirmed_at)throw new Error('Uma conta confirmada é necessária.');
      return {id:usuario.id,isAnonymous:false};
    },
    async consultarSolicitacao({id,usuarioId,token}={}){
      if(!uuid.test(id||'')||!uuid.test(usuarioId||''))throw new Error('Solicitação inválida.');
      const filtros=new URLSearchParams({select:'id,cliente_usuario_id,profissional_usuario_id,status,valor_centavos,atualizado_em',id:'eq.'+id,cliente_usuario_id:'eq.'+usuarioId,limit:'1'});
      // Usa o JWT do cliente; as políticas RLS continuam aplicadas.
      const registros=await consultar('/rest/v1/solicitacoes?'+filtros,token);
      if(!Array.isArray(registros)||registros.length>1)throw new Error('Resposta inválida.');
      return registros[0]||null;
    },
  });
}
