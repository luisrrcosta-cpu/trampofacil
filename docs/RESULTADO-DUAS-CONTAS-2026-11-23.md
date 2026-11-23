# Resultado do teste manual com duas contas
Data: 23/11/2026. Ambiente: homologação asdszqtpydiowgerxwee.

## Resultado confirmado
O proprietário entrou nas contas pelo aplicativo e executou o pedido “Teste — sem serviço real”. A consulta somente leitura ao banco confirmou contas distintas, estado em_andamento, pedido de nota existente e atendimento confirmado.
A captura enviada pelo proprietário às 18h00, horário de São Paulo, mostra a visão cliente (“Enviada”) e a mensagem de que o profissional está cuidando do pedido de nota.

## Cobertura
- Cliente cria solicitação; profissional envia orçamento; cliente aceita.
- Cliente registra pedido de nota.
- Profissional confirma atendimento.
- Cliente consulta e visualiza a confirmação.

Esta validação complementa os testes automatizados e PostgreSQL com claims simuladas; não substitui auditoria completa de autenticação. Códigos OTP e tokens não foram inspecionados ou compartilhados.

## Dificuldade observada
O proprietário alternou repetidamente entre o pedido novo “Teste” e o antigo “Reparo ou manutenção”. Os cartões são longos e usam rótulos iguais para consulta fiscal.
A revisão de servicos.js encontrou consulta fiscal localizada no cartão, com guardas de sessão e versão; não comprovou redirecionamento para outro pedido. Não atribuir uma causa técnica sem reprodução.
Melhoria recomendada: facilitar identificação e navegação por pedido, com teste de dois cartões e tela móvel antes de publicar alteração.

## Limites
Nenhum dado foi apagado. O pedido de teste continua em andamento. Não há nota fiscal emitida, cobrança ou repasse validado por este teste. Produção permaneceu fora do escopo.
O roteiro anterior em VALIDACAO-DUAS-CONTAS-OTP-2026-11-23.md é histórico de preparação; a pendência de execução ali registrada foi resolvida por este resultado.
