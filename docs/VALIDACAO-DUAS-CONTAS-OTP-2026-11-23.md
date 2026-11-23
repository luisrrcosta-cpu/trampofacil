# Validação manual com duas contas — homologação

Data: 23/11/2026. Base: 2a3d6e4a6c2f3d4f878d174eff900c77e6f1f726.

## Evidências verificadas
Os três workflows da base terminaram com sucesso: testes isolados, concorrência PostgreSQL e testes financeiros.
A homologação possui um cliente, um profissional e um profissional disponível. Contagens não comprovam identidades distintas.

## Pendência
A validação ponta a ponta com duas identidades autenticadas por e-mail ainda não foi executada. Os testes PostgreSQL anteriores usaram papéis reais com claims simuladas e rollback; não substituem este teste.

## Participação necessária do proprietário
Usar duas caixas de e-mail sob seu controle, com sessões separadas em dois navegadores ou dispositivos. Digitar os códigos exclusivamente no aplicativo. Não compartilhar códigos, senhas ou tokens no chat. Acesso privado do site permanece inalterado; não convidar terceiros para o site.

Aplicativo: https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site

1. Manter a conta do profissional existente. Não editar seus campos públicos durante este teste, pois mudanças materiais exigem nova análise.
2. Entrar com o segundo e-mail pelo cadastro de cliente e preencher dados de teste. O login comum não cria conta nova.
3. Na conta cliente, buscar o profissional disponível e enviar uma solicitação explicitamente fictícia.
4. Na conta profissional, conferir que a solicitação foi recebida e enviar um orçamento de teste.
5. Na conta cliente, aceitar o orçamento e solicitar nota fiscal.
6. Na conta profissional, consultar o pedido e confirmar seu atendimento.
7. Na conta cliente, conferir a confirmação de atendimento. Ela não representa emissão de nota.
8. Trocar entre as sessões e conferir autoria das mensagens, histórico e atualização dos estados.

## Critérios e limites
Registrar somente resultado, etapa e eventual mensagem de erro; não registrar códigos de acesso ou dados pessoais.
Não preparar checkout, cobrar, emitir nota real, alterar produção ou apagar registros.
Se a autenticação falhar ou as contas não estiverem separadas, interromper os passos dependentes.
Os cadastros e a solicitação deste teste persistirão na homologação e devem ser identificados como teste; nenhuma limpeza automática está autorizada.

Resultado atual: aguardando login manual nas duas contas.
