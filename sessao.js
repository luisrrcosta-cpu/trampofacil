'use strict';

// Cada entrada/saída invalida requisições anteriores, mesmo da mesma conta.
function criarControleSessao() {
  let sessao;
  let versao = 0;
  return {
    alterar(novaSessao) {
      sessao = novaSessao;
      versao++;
    },
    async requisitar(operacao) {
      const atual = versao;
      const token = sessao?.token;
      if (!token) throw new Error('Entre na sua conta para continuar.');
      const validar = () => {
        if (atual !== versao) throw new Error('A sessão mudou. Atualize a tela antes de continuar.');
      };
      const resposta = await operacao(token);
      validar();
      return {
        ok: resposta.ok,
        status: resposta.status,
        async json() {
          validar();
          const dados = await resposta.json();
          validar();
          return dados;
        },
      };
    },
  };
}

const controleSessao = criarControleSessao();
