# Homologação isolada do TrampoFácil

Projeto de testes: `TrampoFacil-Homologacao` (`asdszqtpydiowgerxwee`), região
`sa-east-1`, organização Trampo fácil. Criado em 19/11/2026 com cotação de
US$ 0/mês. Não autoriza contratar recursos pagos.

## Estrutura instalada

`bootstrap.sql` é uma referência da estrutura inicial, sem linhas, de seis
tabelas da aplicação. Destina-se exclusivamente a um banco NOVO de homologação.
Não executar em produção nem em um banco que já contenha essas tabelas.
O script não copia contas, perfis, telefones, mensagens ou contratações.
Os privilégios MAINTAIN não foram reproduzidos; não são necessários à aplicação.

Na homologação, foram aplicadas em seguida as duas migrações desta ramificação:

- `20261118232831_restringir_escrita_de_perfis.sql`
- `20261118233358_conectar_catalogo_e_solicitacoes.sql`

RLS permanece habilitada nas seis tabelas. Os gatilhos internos usam schema
privado, search_path vazio e execução direta revogada para clientes da API.

## Verificação em 19/11/2026

`validar-fluxo.sql` foi executado no PostgreSQL real de homologação. A transação
cria três identidades fictícias sem senha, exercita as permissões com
`SET LOCAL ROLE authenticated` e termina com ROLLBACK.

Passaram: isolamento entre participantes e terceiros; catálogo público sem
telefone privado; criação, proposta, aceite, execução, entrega e conclusão;
preço aceito imutável; histórico com seis eventos; mensagem indevida por
terceiro bloqueada; mensagem após conclusão bloqueada.

Após o teste, clientes, profissionais, solicitações, mensagens e histórico
continuaram com zero registros. O verificador de segurança retornou zero
alertas. Isso valida o banco com claims controladas, não o login real pelo
Auth nem a integração HTTP do aplicativo.

## Ainda pendente

Configurar hospedagem de homologação e origem permitida; testar login real
com contas de teste e os adaptadores Auth/Data API. `config.js` aponta agora
somente para este projeto, com chave publicável e `autenticacaoPronta: false`.
A busca está conectada; cadastro e login não enviam requisições enquanto o
envio de códigos não for validado. Um aviso identifica o ambiente de testes.
`ambiente.js` recusa qualquer outro projeto, inclusive o de produção.
Nenhuma chave secreta foi adicionada ao repositório.

## Verificação da API pública

`npm run test:homologacao` consulta exclusivamente este projeto e passou em
19/11/2026: RPC de busca respondeu HTTP 200; as cinco tabelas privadas recusaram
acesso sem sessão com HTTP 401 e erro PostgreSQL 42501; Auth recusou consulta
de usuário sem token. O catálogo estava vazio. Não foram emitidos e-mails,
criadas contas nem gravados registros. O script não roda em `npm test` ou
automaticamente no workflow.

## Liberação do login de testes

O endpoint público de configurações confirma e-mail habilitado, confirmação
obrigatória e login anônimo desabilitado. Ele não informa o conteúdo dos
modelos nem confirma entrega de mensagens.

1. Conferir os modelos de confirmação de cadastro e Magic Link no
   [painel de modelos](https://supabase.com/dashboard/project/asdszqtpydiowgerxwee/auth/templates).
   `email-codigo.html` contém o modelo em português com `{{ .Token }}`.
2. Conferir entrega para as contas de teste. O SMTP padrão envia apenas para
   membros da organização; outros destinatários exigem configurar um serviço
   de envio. Não desabilitar confirmação para contornar falhas de entrega.
3. Validar emissão, confirmação, cadastro e nova entrada com contas de teste.
   Só então alterar `autenticacaoPronta` para `true` nesta ramificação.

Referências verificadas:

- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/auth/auth-smtp

PagBank permanece sem chamadas ou cobranças. Taxas online, impostos, credenciais
de sandbox e modelo de divisão/repasses ainda precisam de definição antes
dos testes financeiros integrados. Main e Supabase de produção não foram alterados.
