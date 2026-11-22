# Diferenças verificadas — Edge de homologação

Data da inspeção: 2026-11-22.

## Ambiente consultado
- Projeto Supabase: `TrampoFacil-Homologacao` (`asdszqtpydiowgerxwee`).
- Função: `preparar-pagamento-teste`, publicada como versão **15**, estado **ACTIVE**.
- Repositório: `luisrrcosta-cpu/trampofacil`, branch `codex/v16-seguranca-integracoes`.
- **Produção não foi consultada nem alterada para esta comparação.**

## Diferença confirmada
O arquivo `server/edge-homologacao.js` do GitHub importa
`criarRegistradorTentativaInerte` de `./registrar-tentativa-inerte.js`
e define o adaptador `registrarTentativaInterna`.

O arquivo de mesmo nome incluído na função Edge publicada **não contém**
esse import nem o adaptador. O adaptador novo no GitHub é intencionalmente
interno e não está exposto como rota HTTP; portanto, a diferença por si só
**não comprova falha de segurança nem habilitação de pagamentos**.

## Próximos passos antes de publicar
1. Conferir o conjunto de arquivos que compõe o bundle Edge e as importações relativas.
2. Executar a suíte Node de preparação, autenticação, roteamento e tentativas inertes.
3. Testar requisições sem JWT, com origem indevida e com dados inválidos.
4. Publicar **somente em homologação**, com autorização vigente, mantendo um plano de reversão.
5. Confirmar a versão publicada e repetir os testes após o deploy.

## Estado
Comparação concluída; **nenhum deploy realizado** nesta inspeção.
Não usar esta auditoria como evidência de teste ponta a ponta ou de pagamento real.
