# Verificação de implantação — TrampoFácil Homologação

Conferência de 21/11/2026. Somente ambiente de homologação `asdszqtpydiowgerxwee`.

## Estado observado

- Edge Function `preparar-pagamento-teste`: **ACTIVE, versão 2**.
- A versão implantada de `server/edge-homologacao.js` possui apenas a rota de preparação de pagamento.
- A branch `codex/v16-seguranca-integracoes` já contém o adaptador interno `criarRegistradorTentativaInerte`, não presente na cópia implantada.
- O adaptador novo não expõe rota HTTP para registrar tentativas.
- **Não foi realizada implantação nesta conferência.** Nenhuma cobrança real foi ativada.

## Antes de qualquer implantação

1. Conferir diferenças entre todos os arquivos empacotados na Edge Function e os arquivos da branch.
2. Executar a suíte Node 22 completa e confirmar o resultado do GitHub Actions.
3. Validar as variáveis de ambiente da homologação sem revelar credenciais e o domínio permitido.
4. Implantar exclusivamente no projeto de homologação e preservar `verify_jwt` e validação de token pela aplicação.
5. Testar rota inexistente, token ausente/inválido, origem não autorizada e preparação com orçamento aceito.
6. Verificar que não existe rota pública de cobrança, repasse ou registro de tentativa financeira.
7. Nunca implantar no projeto de produção ou habilitar pagamentos reais nesta etapa.

## Pendência independente

A idempotência no banco foi testada sequencialmente, mas o teste com **duas conexões PostgreSQL realmente simultâneas** ainda precisa de comprovação.
