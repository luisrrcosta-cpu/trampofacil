# Validação de homologação — 20/11/2026

Projeto: TrampoFacil-Homologacao (`asdszqtpydiowgerxwee`).
Ramificação: codex/v16-seguranca-integracoes.
Código validado em CI: `bb3eecb5cc7a4f73dd222ab0f09e7dd76d549140`.
Execução: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/44813907801

## Resultados

- 61 testes automáticos e sete suítes de regressão aprovados no GitHub.
- `validar-preparacao.sql` executado no Postgres remoto de homologação: aprovado.
- Fluxo solicitada → proposta → aceita → em_andamento → entregue → concluida validado com histórico de seis eventos.
- Terceiro não lê pedido/perfil privado nem envia mensagens. Mensagem após encerramento recusada.
- Preço aceito protegido. Preparação repetida mantém o mesmo registro; versão antiga, condições diferentes e outro cliente são recusados.
- Serviço de R$150 preserva R$135 ao profissional e R$15 à plataforma, antes de impostos. Cobranças desabilitadas.
- Teste transacional revertido. Consulta posterior confirmou zero contas, solicitações e preparações pertencentes aos identificadores fictícios do teste.

## Limites e próximas dependências

Os papéis autenticados do teste SQL são representados dentro da transação; isso não testa emissão de JWT ou entrega de e-mail. Nenhum login real, envio de e-mail ou pagamento foi executado nessa validação.

A função Edge remota está na versão 2, com origem da prévia privada e autenticação obrigatória no corpo do POST. Seus seis testes HTTP sem sessão válida passaram na etapa anterior.

O frontend permanece com `autenticacaoPronta: false`. Falta validar modelos/entrega de e-mail, sessão real e chamada autenticada HTTP ao serviço. O conector atual não oferece edição dos modelos de Auth. Não desabilitar confirmação de e-mail, inventar credenciais ou expor tabelas privadas para contornar essa dependência.

Também faltam credenciais PagBank sandbox, taxas online e tributação confirmadas, divisão/repasse, webhook verificado e conciliação. As referências de maquininha não são taxas confirmadas do checkout online.

A prévia privada existente usa um snapshot anterior; commits posteriores na ramificação não representam publicação automática da interface. A main, o banco de produção e pagamentos reais não foram alterados.
