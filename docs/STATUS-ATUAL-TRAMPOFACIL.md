# Estado atual recuperável — TrampoFácil

Atualização: 24/11/2026. Este resumo substitui os estados intermediários dos documentos históricos.

- Repositório: luisrrcosta-cpu/trampofacil.
- Branch de desenvolvimento: codex/v16-seguranca-integracoes.
- Supabase autorizado: TrampoFacil-Homologacao, `asdszqtpydiowgerxwee`.
- Site privado: https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site
- Última alteração de interface validada: `23ae7994cd7c8f52f322baa014bddf624e0def8f` (consulta autenticada da tentativa salva).
- Publicação privada da consulta confirmada como succeeded/ready. Fonte hospedada: `88d63c6b3b6787f6e7d81e615212a9cf9a3f6815`.
- CI do commit de interface `878ba44f405b78514903ffe454c8c4301eb787c4`: geral/interface, financeiros, concorrência e prévia com success. Checkout externo ainda incerto.

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

- Validação remota concluída: geral/interface 45526874590, financeiros 45526874544, concorrência 45526874565 e prévia 45526874554 com success no commit 878ba44f405b78514903ffe454c8c4301eb787c4.
- Prévia privada empacotada da fonte f16181b01a72e5f7ba94903129b6abaa45aa8dec. Publicação solicitada, ainda pending/publishing; consultar deployment_id appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_3e0a42f6871881918a4b8d34b6a0e48e antes de afirmar que está disponível. Version_id appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_fcb7075cc084819182a6eabbd24a3bdc. Acesso permanece somente ao proprietário.

## Publicação confirmada e escopo documental — 24/11/2026
- Deployment appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_3e0a42f6871881918a4b8d34b6a0e48e confirmado succeeded/ready. As anotações anteriores pending descrevem o momento do envio, não o estado atual.
- Plano em docs/PLANO-VERIFICACAO-PRIVADA-PROFISSIONAIS.md define etapas fictícias, acesso específico, isolamento, auditoria e decisões pendentes. Não houve coleta de documentos, criação de bucket, nova permissão ou selo de verificação.
- Integração real do checkout continua bloqueada pela tentativa incerta sem CHEC_id. Não repetir POST nem tentativas de login no PagBank sem mudança relevante.

## Consulta autenticada da tentativa salva — 24/11/2026
- Endpoint consultar-tentativa-checkout-sandbox implantado somente na homologação, versão 1 ACTIVE. Autenticação normal no Auth; SELECT com filtro pelo titular e transação read only. Sem alteração de schema/grants, acesso ao PagBank ou mutação de registros.
- Retorna somente estado local e flags de pagamento/repasse falsas; ausência e outro titular têm o mesmo 404. Corrupção/flag financeira incompatível falha fechada. Não devolve identidade, dados do orçamento, URL ou corpo do provedor.
- Interface inclui Consultar tentativa de checkout. Estado salvo existente bloqueia novo envio; resposta inválida não autoriza reenvio. Não presume que estado criado comprova pagamento.
- 19 testes locais aprovados (checkout, duplicidade e estado). SQL da homologação em read only/ROLLBACK confirmou incerto e flags falsas; chamada HTTP sem sessão retornou 401. Fluxo HTTP autenticado testado com API de Auth simulada e PGlite, não com a sessão real do navegador.
- Aguardar CI da interface antes de publicar as novas telas. A tentativa incerta anterior não foi reenviada nem resolvida.

- CI confirmada success: geral/interface 45527910268, financeiros 45527910213, concorrência 45527910279 e prévia 45527910321 no commit 23ae7994cd7c8f52f322baa014bddf624e0def8f.
- Telas preparadas da fonte hospedada 88d63c6b3b6787f6e7d81e615212a9cf9a3f6815. Publicação privada solicitada, pending/publishing. Deployment appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_5d7294fd3ca881919b39512d70659832; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_def216c744fc8191861286498bb38a34. Consultar status antes de afirmar disponibilidade.

## Consulta validada com sessão real do cliente — 24/11/2026
- Publicação da consulta confirmada succeeded/ready: deployment appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_5d7294fd3ca881919b39512d70659832.
- Após retomada do navegador, cliente entrou normalmente por código seguro. Mesmas condições de crédito à vista recuperaram a preparação 88cecf6d-cf3b-4112-a8ca-9a33d767a58e; não foi criado outro orçamento ou checkout.
- Botão Consultar tentativa de checkout executado na interface publicada. Tela mostrou resultado incerto e manteve Gerar checkout sandbox desativado; consulta e retorno às solicitações disponíveis.
- Contagem antes/depois: uma tentativa, uma incerta, flags de cobrança real e repasse desativadas. Integração autenticada da consulta local comprovada; não comprova checkout ou notificação real do PagBank.
- Próximo bloqueio externo permanece recuperar CHEC_id/conferir a tentativa no provedor. Não repetir POST nem recriar preparação para contornar esse estado.

## Conferência externa pendente — 24/11/2026
- Pesquisa oficial não confirmou consulta por referência para recuperar checkout sem CHEC_id. Orientação geral de idempotência não foi tratada como autorização para reenvio desta tentativa.
- Rascunho pronto, não enviado: docs/RASCUNHO-SUPORTE-PAGBANK-CHECKOUT-INCERTO.md. Inclui referência, timestamp, valor e perguntas sobre criação, idempotência, acesso ao sandbox e assinatura de notificações. Sem credenciais ou documentos pessoais.
- Bloqueio principal de pagamentos é externo: obter CHEC_id/evidência de rejeição e compatibilidade do webhook. Consulta local, bloqueio de duplicação e testes automáticos não substituem isso. Não ativar pagamentos reais.

## Revisão de prontidão consolidada — 24/11/2026
- Documento docs/REVISAO-PRONTIDAO-TRAMPOFACIL.md separa evidências internas, pendências externas e condições para propor lançamento.
- Consulta atual: um checkout registrado, zero flags reais ativas, zero notificações recebidas e zero notificações financeiras. Advisors sem mudança em relação aos avisos já registrados.
- Não foram criados novos testes, alterado código executável, reenviado checkout ou modificada produção nesta revisão. Não confundir consolidação de evidências com conclusão da integração PagBank.

## Solicitação ao suporte — resultado não confirmado
- Proprietário autorizou explicitamente encaminhar nome, contato, documento e relato ao suporte PagBank pelo formulário Pipefy. Dados pessoais ficaram no formulário externo; não copiar para este repositório.
- Formulário oficial preparado e botão Abrir Chamado acionado uma única vez. O hCaptcha exigiu arrastar uma letra; proprietário relatou dificuldade e recebeu controle manual.
- Após retorno de controle, desafio não estava mais visível; botão Abrir Chamado permaneceu desativado. Não houve tela de sucesso ou número de protocolo observado.
- Situação do chamado: ENVIO NÃO CONFIRMADO. Não registrar como aberto e não duplicar o envio sem conferir confirmação no canal de contato/suporte. Rascunho técnico continua em docs/RASCUNHO-SUPORTE-PAGBANK-CHECKOUT-INCERTO.md.
- Login no sandbox e envio do suporte são bloqueios distintos. Não há checkout ou pagamento confirmado e nenhum novo POST de checkout foi feito.

## Busca e organização das solicitações — 24/11/2026
- Cliente e profissional podem pesquisar título/descrição dos pedidos carregados, sem distinção de acento/maiúsculas; filtros por enviadas/recebidas e situação combinam entre si. Botão Limpar filtros restaura a lista.
- Busca e tipo são apagados ao trocar de sessão; pesquisa não cria requisições ao servidor e não é persistida. Aviso de escopo explica a paginação para pedidos anteriores.
- Sete testes locais de segurança/duplicidade e regressões de finanças, valores, sessão, estados, contratação, rascunhos e interface aprovados. Chromium local ausente; aguardar teste de navegador no CI antes de publicar.
- Teste de navegador ampliado para busca, filtros combinados, limpeza, ausência de novas chamadas e troca de conta.

- CI aprovada no commit 583e295c43f690171dbf1d4c14767f7daad4c0c9: geral/interface 45606175322, financeiros 45606175133 e concorrência 45606175189. Correção do seletor de teste após falha inicial; não houve publicação com CI falhando.
- Fonte hospedada f7cc8f75fdbac1704c50b2cfafba17a851ae291e. Atualização privada solicitada e ainda pending/publishing: deployment appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_4b81dfeb75e8819183aeae92d9f9e314; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_4bfb12b433248191be719cb4d1aeaba8. Consultar status antes de afirmar disponibilidade. Acesso restrito ao proprietário preservado.

## Resumo de solicitações e última atualização — 25/11/2026
- Publicação anterior dos filtros confirmada succeeded/ready, deployment appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_4b81dfeb75e8819183aeae92d9f9e314.
- Painel mostra contagens das solicitações carregadas por situação e pendência de ação da conta, explicitamente antes dos filtros e sem presumir totais do banco.
- Cada pedido mostra a última atualização com elemento time e horário de Brasília. Não representa agendamento ou início do serviço.
- Contagens são limpas na troca de sessão. Sem consulta adicional, alteração de banco ou efeito financeiro.
- Sete testes locais e regressões aprovados; aguardando CI de navegador antes de publicar novas telas.

- CI confirmada success no commit 33c551b6ddfed609fc0e80988b8163bf948c18d6: geral/interface 45617330934, financeiros 45617330968, concorrência 45617331245 e prévia 45617330959.
- Fonte hospedada dfc1d088c8cd799da87b5f036892d2164a58e13e; publicação privada solicitada pending/publishing. Deployment appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_4574e30c8a88819189f8ff34869c34bd; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_9ed9fedc7c5481918703ec04025fb3e2. Consultar antes de afirmar conclusão.

## Retorno do histórico ao pedido — 25/11/2026
- Publicação do resumo e datas confirmada succeeded/ready: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_4574e30c8a88819189f8ff34869c34bd.
- Ao voltar do histórico, lista continua sendo atualizada; foco retorna ao título do pedido se ele estiver entre os carregados e passar nos filtros. Não força exibição de pedido filtrado ou fora da página.
- Respostas após outra navegação, busca mais nova ou troca de conta não alteram o foco. Rascunho e incerteza de mensagens mantêm comportamento anterior.
- Doze testes locais de sessão/duplicidade e regressões aprovados. Teste de navegador ampliado para foco após atualização e preservação da busca; aguardar CI antes de publicar.

- CI confirmada success no commit 79afc04b450dd6b8872dbf77b906b5540d892500: geral/interface 45618154895, financeiros 45618154958, concorrência 45618155170 e prévia 45618155079.
- Fonte hospedada c5ed5724721ec4b0992fd68956e906891386228f. Publicação privada solicitada pending/publishing: deployment appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_940228f975a8819199fcdb4e22d2f65a; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_d1240a64eee48191a99a455708497b25. Consultar antes de afirmar disponibilidade.
