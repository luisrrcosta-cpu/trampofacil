# Estado atual recuperável — TrampoFácil

Atualização: 24/11/2026. Este resumo substitui os estados intermediários dos documentos históricos.

- Repositório: luisrrcosta-cpu/trampofacil.
- Branch de desenvolvimento: codex/v16-seguranca-integracoes.
- Supabase autorizado: TrampoFacil-Homologacao, `asdszqtpydiowgerxwee`.
- Site privado: https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site
- Fonte preparada das telas: `9455e39495fced798be5acb9b03692e7555f613a`.
- Publicação das telas confirmada como succeeded/ready em 24/11/2026. Commit de hospedagem: `51c046012f76efc6aaa83c74559cda11fed24ef0`.
- Última ampliação dos testes: `1a4f25b6b21d67e7fb401215525a62476312aea4`. Commits posteriores de documentação não mudam a interface.

## Concluído
1. Cadastro e edição de profissionais CPF, MEI e empresa, atividade regular ou ocasional; sem coletar números de documentos em campos públicos.
2. Autenticação normal, RLS, isolamento entre contas, proteção contra autoaprovação e exposição do catálogo apenas para perfis publicados e disponíveis.
3. Pausa/retomada de novos pedidos; alterações relevantes retiram a publicação para nova análise. Contratos existentes preservados.
4. Contratação, orçamento, aceite, início, entrega e conclusão, histórico e mensagens.
5. Pedido de nota fiscal pelo cliente e confirmação de atendimento pelo profissional. O aplicativo não emite nem verifica notas fiscais.
6. Revisor ativo autorizado, fila privada, aprovação com versão exata, orientações de ajuste e recusa administrativa com motivo e auditoria privada. Recusa de publicação permite correção e reconsideração; não bloqueia a conta.
7. Concorrência administrativa em PostgreSQL descartável: onze disputas reais por lock, incluindo revogação, edição, repetição idempotente, motivos sucessivos e aprovação/recusa.
8. Preparação de pagamentos de teste, sem cobrança real.

## Evidências já concluídas — não pedir repetição manual
- Duas contas: solicitação “Teste”, aceite, serviço em andamento, pedido de nota e atendimento confirmado. Captura do proprietário às 18h de 23/11/2026 e consulta do banco.
- Conta revisora: painel e fila vazia exibidos às 19h02 de 23/11/2026. Não comprova aprovação HTTP; não aprovar um perfil existente somente para testar.
- Fluxos do banco validados com identidades fictícias e ROLLBACK, sem persistir testes.
- Recusa aplicada somente na homologação; verificação posterior: zero recusas e aprovações, um profissional e um revisor ativo. Esses números são evidência da entrega de 24/11, não contagem permanentemente atualizada.

## Próximas etapas concretas
1. Pedido fiscal: atendimento, declaração de entrega e confirmação de recebimento implementados. Não presumir recebimento quando o cliente não confirmou; eventual divergência deve ser tratada separadamente, sem apagar os registros.
2. Validar integração real de checkout/notificações exclusivamente de sandbox e cenários de falha. Respostas simuladas não comprovam integração com o provedor.
3. Planejar verificação privada de documentos e habilitações antes de apresentar perfis como verificados. Não iniciar coleta de documentos sensíveis sem apresentar o escopo.
4. Revisar pendências de lançamento com evidências atuais. Não reabrir tarefas concluídas sem mudança ou falha relevante.

## Limites obrigatórios
- Não alterar produção nem a branch principal; não excluir dados nem reduzir RLS/grants.
- Não habilitar pagamento, cobrança ou repasse real. Produção e ativação financeira exigem autorização separada.
- Não pedir senha, OTP ou token. Não gerar sessão administrativa para contornar login.
- Antes de DDL, inspecionar o banco e as migrações; não reaplicar estruturas concluídas.
- Os nove INFO de RLS sem políticas referem-se a tabelas privadas de bloqueio intencional. O WARN de proteção contra senhas vazadas é preexistente; não foi alterado nesta entrega.
- Migrações e testes transacionais: supabase/homologacao/. O teste integrado principal é validar_painel_revisao_rollback.sql.

## Evidências detalhadas
- docs/RETOMADA-VALIDACAO-INTEGRADA-2026-11-23.md
- docs/ATENDIMENTO-NOTA-HOMOLOGACAO-2026-11-23.md
- docs/REVISAO-INTERNA-APLICADA-2026-11-23.md
- docs/PAINEL-REVISAO-HOMOLOGACAO-2026-11-23.md
- docs/CONCORRENCIA-REVISAO-2026-11-23.md
- docs/ORIENTACOES-AJUSTE-PERFIL-2026-11-23.md
- docs/ULTIMA-ORIENTACAO-AJUSTE-2026-11-23.md
- docs/RECUSA-PUBLICACAO-HOMOLOGACAO-2026-11-24.md
- docs/CONCORRENCIA-RECUSA-2026-11-24.md
- docs/REVOGACAO-RECUSA-2026-11-24.md


## Declaração de entrega de nota — 24/11/2026
- Migração entrega_pedido_nota aplicada somente na homologação, com RLS, sem UPDATE/DELETE e sem SECURITY DEFINER.
- Profissional declara entrega após atendimento; cliente consulta. Não comprova emissão, validade fiscal ou recebimento.
- CI completa, testes de interface/recuperação de rede e integração PostgreSQL com ROLLBACK aprovados.
- Zero entregas e identidades QA persistidas. Avisos de segurança sem alteração.
- Telas empacotadas para publicação privada; confirmação de publicação deve ser consultada pelo identificador retornado, sem presumir conclusão.
- Evidência: docs/ENTREGA-NOTA-HOMOLOGACAO-2026-11-24.md.


## Recebimento do documento pelo cliente — 24/11/2026
- Entrega declarada anterior confirmada como publicada (succeeded/ready).
- Confirmação exclusiva do cliente, após entrega declarada; duas partes consultam. Sem emissão/verificação fiscal, efeitos no serviço ou pagamentos.
- CI geral/interface, concorrência, financeiros e prévia aprovados; integração remota com ROLLBACK aprovada.
- Migração recebimento_pedido_nota aplicada somente na homologação. Zero recebimentos/identidades QA persistidos; RLS ativa e sem UPDATE/DELETE.
- Novas telas preparadas para publicação privada; não presumir conclusão sem verificar status retornado.
- Evidência: docs/RECEBIMENTO-NOTA-HOMOLOGACAO-2026-11-24.md.

## Verificação de checkout sandbox — 24/11/2026
- Funções de checkout e webhook ativas na homologação; chamadas sem autenticação/assinatura retornaram 401.
- Acrescentada cobertura para doze respostas divergentes do provedor; suíte checkout: 9 testes aprovados.
- Integração real do provedor ainda pendente; não confundir sondagens 401 ou respostas simuladas com checkout completo.
- Evidência: docs/VALIDACAO-CHECKOUT-SANDBOX-2026-11-24.md.

## Exclusividade de assinatura no webhook — 24/11/2026
- Rota ECDSA agora rejeita a presença simultânea de x-authenticity-token, inclusive vazio, antes de consultar chave, ler corpo ou registrar evento.
- 24 testes locais de checkout/chaves/assinatura/receptor aprovados; inclusão destas suítes no workflow financeiro com instalação travada pelo lockfile.
- Correção aplicada exclusivamente ao webhook-pagbank-sandbox da homologação, versão 2. Dependências implantadas preservadas; somente o receptor foi modificado.
- Evidência: docs/ASSINATURA-EXCLUSIVA-SANDBOX-2026-11-24.md.

## Acesso autenticado e bloqueio do ensaio externo — 24/11/2026
- CI do commit 7631bc5: geral/interface 45521487164, financeiro 45521487308 e concorrência 45521487325 concluídos com success.
- Acesso ao site privado e login normal do cliente por código concluídos pelo proprietário, sem sessão administrativa. Tela Minhas solicitações exibiu um pedido enviado concluído.
- Consulta agregada da homologação: uma solicitação concluída, uma em andamento, nenhuma aceita; zero checkouts e zero notificações.
- Webhook com apenas assinatura fictícia retornou 401 ASSINATURA_INVALIDA. Pelo caminho do código, a consulta de chave foi concluída (ou atendida pelo cache); isso não comprova checkout ou evento autêntico do provedor.
- Próximo ensaio externo exige novo orçamento de teste aceito com participação legítima da conta profissional. Não reabrir pedidos existentes nem aprovar perfil somente para obter acesso ao teste.

## Ensaio externo autenticado do checkout — 24/11/2026
- Login normal nas duas contas de teste concluído; sessões mantidas em abas separadas, sem guardar tokens em disco.
- Novo pedido explicitamente fictício criado pela interface: Teste checkout sandbox — sem serviço real. Profissional propôs R$ 1,00; cliente aceitou. Pedidos anteriores preservados.
- Preparação 88cecf6d-cf3b-4112-a8ca-9a33d767a58e registrada. Uma chamada de criação de checkout retornou resultado não confirmado; banco confirmou estado incerto, valor 100 centavos, sem checkout_id, pagamento_real_habilitado=false e repasse_habilitado=false.
- Não reenviar a operação, apagar o claim ou gerar outra preparação para contornar a incerteza. Antes de novo POST, conferir a tentativa no provedor por referência usando acesso autorizado; ainda não há checkout nem pagamento autenticado confirmado.
- Logs anteriores mostraram apenas inicialização/encerramento. Acrescentado diagnóstico interno mínimo: TRANSPORTE, HTTP com status 400–599, ou RESPOSTA_INVALIDA. Nunca registrar corpo da resposta, token ou dados do comprador. Erro público e bloqueio de repetição preservados.
- Onze testes locais de checkout/pacote Edge aprovados. Adaptador e entrada atualizados somente em criar-checkout-sandbox da homologação, versão 2 ACTIVE; demais dependências implantadas preservadas.

## Recuperação somente leitura de checkout — 24/11/2026
- Login no painel PagBank Sandbox retornou à tela inicial sem causa explícita. Não insistir em novas tentativas automáticas, não presumir senha incorreta nem contornar controles.
- Novo adaptador interno server/consultar-checkout-sandbox.js usa somente GET no host fixo sandbox.api.pagseguro.com/checkouts/CHEC_id, com TLS, timeout, sem redirecionamentos ou retries.
- Exige contexto confiável do servidor: checkoutId, UUID interno, referência tf-sandbox-UUID e valor. Confere identidade, item, quantidade, valor e ausência de acréscimos/descontos/frete/recorrência.
- Retorno mínimo: estado ACTIVE/INACTIVE/EXPIRED, valor e flags pagamentoConfirmado=false/liberarRepasse=false. Não retorna dados do comprador, links, pagamentos associados ou corpo bruto; não escreve no banco.
- Quatro testes locais aprovados e incluídos no workflow financeiro. Consulta não implantada como endpoint público e não executada com credencial real.
- Continua pendente recuperar CHEC_id da tentativa incerta, referência tf-sandbox-89934739-87f9-4c53-b8ca-8b757dd81f53. O endpoint oficial exige o ID: https://developer.pagbank.com.br/reference/consultar-checkout . Não há consulta por referência comprovada para este produto. 404 não prova que uma criação anterior falhou; não reabrir o claim nem reenviar POST.

## Interface após checkout incerto — 24/11/2026
- Resultado HTTP malsucedido, falha de rede ou resposta inválida deixam Gerar checkout sandbox desativado, com orientação para conferência. Reabrir a mesma preparação durante a sessão mantém o bloqueio, sem nova chamada.
- O bloqueio de interface é adicional; o claim durável do servidor continua impedindo outro POST ao provedor após recarga/logout. Estado de sessão não é persistido no navegador.
- Teste de navegador ampliado para rede, HTTP 503 e link/resposta inválidos, verificando reabertura e contagem de requisições.
- Cinco testes locais de envios duplicados passaram. Execução local de Chromium impedida por socket() Operation not permitted antes dos testes; validar interface pelo GitHub Actions antes de publicar.
