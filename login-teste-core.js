// Diagnóstico explícito e isolado: somente homologação, sem criar usuários.
export function criarTesteLogin(config, enviar = fetch) {
  const origem = 'https://asdszqtpydiowgerxwee.supabase.co';
  if (config?.ambiente !== 'homologacao' || config.url !== origem ||
      !/^sb_publishable_[A-Za-z0-9_-]{1,450}$/.test(config.chavePublicavel)) {
    throw new Error('Ambiente de testes inválido.');
  }
  async function chamar(caminho, corpo, token, metodo = 'POST') {
    const resposta = await enviar(origem + '/auth/v1/' + caminho, {
      method: metodo, redirect: 'error', cache: 'no-store', credentials: 'omit',
      signal: AbortSignal.timeout(15000),
      headers: { apikey: config.chavePublicavel, 'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      ...(corpo ? { body: JSON.stringify(corpo) } : {}),
    });
    if (!resposta.ok) throw new Error(resposta.status === 429
      ? 'Limite de tentativas atingido. Aguarde antes de tentar novamente.'
      : 'Não foi possível concluir. Confira os dados ou solicite um novo código.');
    return resposta;
  }
  function emailValido(email) {
    if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Informe um e-mail válido.');
    }
  }
  return {
    async solicitar(email) {
      emailValido(email);
      await chamar('otp', { email, create_user: false });
    },
    async verificar(email, codigo) {
      emailValido(email);
      if (!/^\d{6}$/.test(codigo)) throw new Error('Digite os seis números do código.');
      const resposta = await chamar('verify', { email, token: codigo, type: 'email' });
      let sessao = await resposta.json();
      const token = sessao?.access_token;
      // O refresh token não é utilizado nem exposto ao chamador.
      sessao = null;
      if (typeof token !== 'string' || !token || token.length > 16384) {
        throw new Error('Resposta de autenticação inválida.');
      }
      let verificado = false;
      try {
        const usuario = await (await chamar('user', null, token, 'GET')).json();
        verificado = typeof usuario?.id === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usuario.id) &&
          typeof usuario.email === 'string' && usuario.email.toLowerCase() === email.toLowerCase();
        if (!verificado) throw new Error('A identidade retornada não corresponde ao teste.');
      } finally {
        // Encerra apenas a sessão criada neste teste, sem afetar outros dispositivos.
        try { await chamar('logout?scope=local', null, token); }
        catch { throw new Error('A sessão foi criada, mas seu encerramento não foi confirmado. Feche esta página; não repita o teste agora.'); }
      }
      return { identidadeConfirmada: verificado, sessaoEncerrada: true };
    },
  };
}
