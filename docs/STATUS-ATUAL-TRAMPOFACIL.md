# Estado atual recuperável — TrampoFácil

Atualização: 26/11/2026. Este resumo é o ponto de retomada atual; as entradas posteriores preservam o histórico e podem conter estados intermediários já superados.

- Repositório: luisrrcosta-cpu/trampofacil.
- Branch autorizada: codex/v16-seguranca-integracoes. Não modificar main/produção.
- Supabase autorizado: TrampoFacil-Homologacao, `asdszqtpydiowgerxwee`.
- Prévia privada: https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site . Acesso somente do proprietário.
- Último código de interface validado: `106b12e90245ef646cc1ef36e7e78e566a5a3c1e`.
- Fonte hospedada atual: `6db09b549bd002fb97cff8ebfdcd750ddfc46af2`.
- Publicação confirmada succeeded/ready: `appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_7298bffaa5d481918330219eac14e745`.
- CI da interface publicada: geral/interface 45805601078, financeiro 45805601112, concorrência 45805601314 e prévia 45805582596, todos success. Cadastro inclusivo 45805582511 aprovado.
- Commits posteriores que atualizam apenas evidências/documentação não representam novas funcionalidades.

## Entregas atuais na homologação
1. Cadastro de clientes e profissionais CPF, MEI e empresa, atividade regular ou ocasional, sem coletar números de documentos em campos públicos.
2. Autenticação normal, RLS, isolamento entre contas e catálogo restrito a perfis publicados e disponíveis.
3. Pausa/retomada de novos pedidos; alterações relevantes exigem nova análise. Contratos existentes preservados.
4. Contratação, orçamento, aceite, início, entrega, conclusão, histórico e mensagens.
5. Pedido fiscal, confirmação de atendimento, declaração de entrega e confirmação de recebimento. Não emite ou verifica notas fiscais.
6. Fila administrativa privada, aprovação por versão, orientações, recusa com motivo e auditoria; concorrência validada sem aprovar perfis existentes só para teste.
7. Nota privada de 1 a 5 após conclusão, registrada pelo cliente e visível às partes, com data em Brasília; sem comentário livre ou reputação pública.
8. Busca/filtros/resumo dos pedidos carregados e retorno do histórico ao pedido.
9. Confirmação antes de descartar cadastro preenchido e edição de perfil ao atualizar/trocar tipo; logout limpa os dados privados.
10. Aviso de perda/retorno de conexão, sem reenvio automático. Não há persistência offline nem garantia de recuperação após fechar/recarregar a página.
11. Preparação financeira de teste e consulta autenticada da tentativa salva, sem cobrança ou repasse real.

## Bloqueios reais e próxima ação

| Área | Estado comprovado | Próxima ação necessária |
| --- | --- | --- |
| Checkout sandbox | Tentativa de R$ 1,00 com resultado incerto, sem CHEC_id recuperado | Obter CHEC_id ou evidência da rejeição no provedor antes de qualquer novo POST |
| Suporte PagBank | Caso de atendimento geral 75359297 confirmado pelo atendente em 25/11; não encaminhado às Integrações. Formulário técnico sem envio confirmado | Etapa adiada a pedido do proprietário; continuar desenvolvimento independente, sem exigir ligação ou repetir formulários |
| Notificação autêntica | Receptor e proteção testados, mas integração externa completa não demonstrada | Confirmar contrato de assinatura/payload e validar evento autêntico no sandbox |
| Documentos/habilitações | Escopo privado planejado | Definir e validar procedimento antes de coletar documentos ou exibir selo de verificação |
| Lançamento/financeiro real | Não autorizado | Entregar evidências e definir operação antes de solicitar ativação específica |

- Tentativa preservada: preparação `88cecf6d-cf3b-4112-a8ca-9a33d767a58e`; referência `tf-sandbox-89934739-87f9-4c53-b8ca-8b757dd81f53`.
- Não reenviar o checkout, apagar o claim, reabrir o pedido ou criar outra preparação para contornar a incerteza.
- Relato técnico: docs/RASCUNHO-SUPORTE-PAGBANK-CHECKOUT-INCERTO.md. Não copiar CPF, senha, OTP ou token para o repositório.
- Novos testes internos ou refinamentos de tela não resolvem o bloqueio externo. Revisão de lançamento em docs/REVISAO-PRONTIDAO-TRAMPOFACIL.md.

## Evidências concluídas — preservar
- Contratação, nota e consulta da tentativa já tiveram verificações autenticadas registradas; não pedir repetição manual sem falha ou alteração relevante.
- Avaliações: RLS/grants verificados, ensaio com identidades fictícias e ROLLBACK concluído; nenhuma avaliação criada em nome das contas existentes.
- Os números de registros em entradas históricas são fotografias datadas, não contagens permanentemente atualizadas.
- Última consulta de advisors em 25/11 manteve os avisos preexistentes: INFO RLS sem políticas em tabelas privadas intencionalmente bloqueadas e WARN de proteção contra senhas vazadas. Nenhuma política reduzida.

## Limites obrigatórios
- Não alterar produção/main, excluir dados ou reduzir RLS/grants.
- Não habilitar cobrança, pagamento ou repasse real.
- Não pedir senha, OTP ou token nem gerar sessão administrativa para contornar login.
- Antes de DDL, inspecionar tabelas/migrações; não reaplicar estruturas concluídas.
- Manter acesso privado da prévia e dados sensíveis fora do repositório.

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

## Avaliação privada após conclusão — implementação de 25/11/2026
- Revisão confirmou ausência de avaliações no código, tabelas e migrações da homologação.
- Implementada nota de 1 a 5, uma por solicitação concluída, registrada pelo cliente e lida apenas pelas partes. Sem comentário livre, reputação pública ou impacto financeiro.
- Migração gerada pela CLI: supabase/migrations/20261125125859_avaliacoes_servico_homologacao.sql. RLS e grants restritos; autor/data definidos no servidor, sem UPDATE/DELETE ou SECURITY DEFINER.
- Tela consulta antes de oferecer registro; resposta perdida exige consulta, sem reenvio automático. Autor, solicitação, nota e data são validados antes de exibir.
- Testes PGlite e regressões locais aprovados. CI de navegador pendente; estrutura ainda não aplicada remotamente e novas telas ainda não publicadas nesta etapa.


## Avaliações privadas — validação e implantação em 25/11/2026
- Código: 898ca9756b729b2099491eeec3f05d1e4030b773; ajuste da prévia: 5ae299799810a09136ebaf79b1222a7a77839908. As quatro verificações GitHub Actions passaram (interface/browser, financeiro, concorrência e pacote da prévia).
- Migração avaliacoes_servico_homologacao aplicada somente em asdszqtpydiowgerxwee. RLS ativa, INSERT restrito a solicitação/nota; autor e data definidos pelo banco, sem UPDATE/DELETE e sem leitura anônima.
- Ensaio remoto validar_avaliacoes_rollback.sql passou com roles reais no fluxo completo até conclusão, inserção única, bloqueio de alteração, terceiros e sessões anônimas. ROLLBACK final; zero avaliações persistidas. Nenhuma avaliação criada em nome das contas existentes.
- Advisories de segurança antes/depois iguais: INFO rls_enabled_no_policy e WARN auth_leaked_password_protection já existentes.
- Publicação privada solicitada: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_5f256e4ca5588191826ee1c075631ed2; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_b1a1597c83dc81919364c837929e2ee7; fonte f91221b37c4a8c24858db554c2fc34c73d49301c. Retorno pending/publishing; confirmar no próximo turno, sem afirmar publicação concluída.
- Pagamentos reais/repasse continuam desabilitados; tentativa PagBank incerta segue bloqueada e depende de conferência externa.


## Avaliações disponíveis na prévia privada — 25/11/2026
- Confirmado succeeded/ready no deployment appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_5f256e4ca5588191826ee1c075631ed2, fonte f91221b37c4a8c24858db554c2fc34c73d49301c. As anotações pending anteriores são históricas.
- CI do registro b446f24b1139c630d174713c771651c2ff367257 também aprovada: geral/interface, financeiro e concorrência. Nenhum novo teste manual repetido.
- Revisão de prontidão atualizada com as avaliações entregues e situação correta do suporte: envio não confirmado, sem protocolo. PagBank continua dependente da conferência externa; não reenviar checkout.
- Sem alterações executáveis, banco ou acesso nesta confirmação. Produção e pagamentos reais preservados.


## Data da avaliação e integração da tela — 25/11/2026
- Avaliação confirmada agora exibe data/hora em Brasília com elemento time e datetime ISO. Falha ou nova consulta oculta a data anterior; sem alteração do contrato ou do registro no banco.
- Teste da aplicação completa com API simulada cobre persistência visual após recarga sem POST, consulta tardia após logout e retorno ao login após 401. Usa os scripts reais do index.html, além do ensaio isolado anterior.
- Sintaxe e três testes locais de acesso/segurança aprovados. Teste de navegador aguardando CI; ainda não publicada esta alteração de tela.

- CI aprovada no commit 49e3b6fd8a7f71c3d784f14d2951fcf06f054807: suíte geral 45621476099 (253 testes, zero falhas), financeiro 45621476135, concorrência 45621476003 e prévia 45621476193. O novo teste da aplicação completa passou.
- Fonte hospedada eff5d05865074ae26529621b1009d6e95994264c. Publicação privada solicitada pending/publishing; deployment appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_58cf280a15948191b717e5f527c81dc0; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_5d7ee60474d48191853ce85bdaf83447. Conferir status no próximo turno antes de afirmar conclusão. Acesso continua somente do proprietário; banco e pagamentos não alterados nesta etapa.


## Saída do cadastro sem perda acidental — 25/11/2026
- Publicação anterior da data da avaliação confirmada succeeded/ready: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_58cf280a15948191b717e5f527c81dc0.
- Corrigido Voltar nos cadastros de cliente e profissional: se houver campo alterado, confirmar antes de descartar. Cancelar mantém campos, modalidade e contador; aceitar limpa antes de voltar. Formulário vazio segue sem confirmação.
- Teste de navegador em largura de celular cobre cliente, modalidade, descrição, recusa/aceite e ausência de chamadas externas. Sintaxe validada; CI pendente antes de publicação.

- Após ajustar o seletor do teste, CI geral aprovada no commit 46e96624c775bb49870399c6c9c4676b21b7e9f7: run 45623671597, 254 testes aprovados e zero falhas, incluindo confirmação/cancelamento em tela de celular. Financeiro 45623671587 e concorrência 45623671428 também success; prévia e cadastro inclusivo já haviam passado no commit de implementação 29025513b5abf9f062eaf5d7e12f10104f68f7d9.
- Fonte hospedada e0ab99652648a84ab2cc541dfe945cd61439086a. Publicação privada solicitada pending/publishing: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_08857e694fb081918c045300f53b326b; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_55be58f6edd08191a318da1e41398a92. Conferir no próximo turno antes de afirmar conclusão. Somente comportamento do botão Voltar do cadastro; não garante preservação após recarga/fechamento do navegador. Sem armazenamento de novos dados, alteração de banco ou efeito financeiro.


## Proteção de alterações no perfil — 25/11/2026
- Saída do cadastro publicada e confirmada succeeded/ready: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_08857e694fb081918c045300f53b326b.
- Atualizar cadastro/trocar tipo agora pede confirmação se houver alterações não salvas no perfil. Cancelar conserva campos e restaura o seletor para o tipo em edição. Perfil sem mudanças recarrega normalmente.
- Referência em memória atualizada somente após carga/gravação confirmada. Falha de gravação mantém proteção; logout continua limpando dados sem confirmação. Disponibilidade preserva o rascunho.
- Teste da aplicação com API simulada cobre cancelamento, troca cliente/profissional, gravação confirmada e falha, modalidade e logout. Aguardando CI antes de publicar.

- CI aprovada no commit caf73a54fc27a785475a8f29f2b2eed93bc7cefd: geral/interface 45625746013 (255 testes, zero falhas), financeiro 45625745985, concorrência 45625746091 e prévia 45625745925. Nove testes locais de sessão/segurança também passaram.
- Fonte hospedada 8f38ad6efb5b79b335531768836aee8dbb06dcda. Publicação privada solicitada pending/publishing: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_ad07e404b17c8191bd9fc2af6b070d99; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_4dd26ce0a24481919a1a867ad35895e3. Conferir no próximo turno antes de afirmar disponibilidade. Proteção cobre recarga pelo app e troca de tipo, sem promessa de recuperar após fechamento ou recarga do navegador. Sem alteração de banco ou pagamento.


## Aviso contextual de conexão — 25/11/2026
- Proteção da edição de perfil publicada e confirmada succeeded/ready: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_ad07e404b17c8191bd9fc2af6b070d99.
- Confirmado timeout de 15 segundos já existente nas chamadas; preservado.
- Aviso de perda/retorno da conexão com role status e aria-live. Orienta conservar a tela e conferir envio pendente antes de repetir. Não envia, consulta, recarrega, salva ou limpa dados automaticamente.
- Eventos online/offline indicam a conectividade do dispositivo; não comprovam disponibilidade do Supabase nem resultado de gravação. Não há promessa de funcionamento offline ou persistência após fechar a página.
- Testes locais de segurança e regressões aprovados; teste de navegador com rede offline/online, foco, preenchimento e zero requisições aguardando CI antes de publicar.

- CI aprovada no commit 05ff6455cb79cddc6681b6cdfd7ffb8b39aa9363: geral/interface 45626595596 (256 testes, zero falhas), financeiro 45626597535, concorrência 45626595548, prévia 45626595591 e cadastro inclusivo 45626595686.
- Fonte hospedada ef6af1a2ba18f8eb9d728fd68c4bf5bf24d2634c. Publicação privada solicitada pending/publishing: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_45a5a68d178081919b0f04ce52e5a979; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_40236a31f630819189a90d60fd337850. Conferir status no próximo turno antes de afirmar conclusão. Nenhuma nova persistência, requisição de recuperação ou alteração financeira.


## Identificação do serviço nas confirmações — 25/11/2026
- Diálogos de proposta, aceite, início, entrega, conclusão e cancelamento exibem o título do serviço. Atualizar proposta exibe valor anterior e novo para conferência antes da decisão.
- Nenhuma regra de transição, payload, autorização ou pagamento alterada. Sintaxe e regressões locais aprovadas; validar a suíte existente de interface antes de publicar. Sem novos testes para simples alteração de texto.


- CI confirmada success no commit 2b2e0c589f96e7613ca581e24f8af30bf0ba2c44: geral/interface 45627923791, financeiro 45627923745, concorrência 45627923735 e prévia 45627923862. Conferência na página Actions; nenhum teste manual repetido.
- Arquivo dist/servicos.js da prévia comparado integralmente ao servicos.js desse commit, com igualdade confirmada e sintaxe aprovada. Fonte hospedada 9d1c466fa58400f2fa1670b53999f32b6bb815ef.
- Publicação privada solicitada pending/publishing: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_f902ffe516988191878a1788a4f10800; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_ce3eb28b0044819184a6ce0f32df817e. Confirmar status no próximo turno antes de afirmar disponibilidade. Acesso somente ao proprietário preservado; nenhuma alteração de banco, produção ou pagamentos.


## Confirmações publicadas e dependência externa — 25/11/2026
- Deployment appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_f902ffe516988191878a1788a4f10800 confirmado succeeded/ready; fonte 9d1c466fa58400f2fa1670b53999f32b6bb815ef. As anotações pending anteriores são históricas.
- Revisão de prontidão consultada: a próxima ação do checkout depende de confirmação do suporte/provedor, sem novo CHEC_id ou evidência de rejeição disponível nesta conversa. Necessário obter do proprietário eventual confirmação/protocolo recebido antes de duplicar o chamado.
- Nenhum novo ensaio, repetição de login, coleta documental ou POST de checkout executado. Sem nova funcionalidade ou resolução financeira nesta conferência.


## Retomada do aplicativo sem dependência do PagBank — 26/11/2026
- Proprietário solicitou adiar o suporte externo após desgaste com formulários, CAPTCHA e transferências. Não exigir ligação ou novos ensaios manuais para continuar o aplicativo. Caso geral 75359297 registrado, sem evidência de encaminhamento técnico. O checkout incerto permanece preservado; não repetir POST nem habilitar pagamentos reais.
- Implementado pedido de confirmação ao Voltar à busca de nova solicitação com título, descrição ou modelo alterado. Cancelar conserva campos, contador, aviso e tentativa em memória; confirmar descarta e volta à busca. Pedido vazio sai sem confirmação, operação pendente não navega. Logout continua limpando dados, sem confirmação adicional.
- Não há persistência após recarga/fechamento. Nenhuma alteração de banco, permissões ou fluxo financeiro.
- Commits de código 106b12e90245ef646cc1ef36e7e78e566a5a3c1e e testes 361f8605031be3c42ebada58ea881ce83fb785b1. Quatro testes locais passaram; CI geral/interface/regressões 45805601078, financeiro 45805601112 e concorrência 45805601314 concluídos success; prévia 45805582596 e cadastro inclusivo 45805582511 success no commit de implementação.
- Fonte hospedada 6db09b549bd002fb97cff8ebfdcd750ddfc46af2. Publicação privada solicitada pending/publishing: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_7298bffaa5d481918330219eac14e745; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_d15a422f75c88191b5ee1d114f592d06. Confirmar status antes de afirmar disponibilidade. Acesso somente ao proprietário preservado.


## Ordenação de solicitações carregadas — 26/11/2026
- Proteção de saída da nova solicitação confirmada publicada succeeded/ready: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_7298bffaa5d481918330219eac14e745. Cabeçalho acima identifica a última publicação confirmada, não a atualização ainda em processamento.
- Seletor permite atualização mais recente, mais antiga ou aguardando minha ação primeiro. Usa a sequência original retornada pelo servidor; escopo limitado aos cards carregados, combinado com busca/filtros. Não altera cursor, consultas, banco ou regras financeiras.
- Move os mesmos cards, preservando campos de proposta e handlers. Limpar filtros e troca/encerramento de sessão restauram recentes. Não promete preservar rascunho após recarregar a lista ou fechar o navegador.
- Implementação 2731a5b7bac0ed223a04f7de9e7f87d32a60e128; rótulo acessível corrigido em fed577ba17e3c10085025e861c83dfdaf6fd8f68; testes finais 74bd53ac52e36f9fbb98097cbc18604bad19f0bc. Falhas iniciais do ensaio de navegador corrigidas antes de publicar.
- CI final geral/interface/regressões 45807229647, financeiro 45807229830 e concorrência 45807229651 concluídos success. Prévia 45806728660 success na implementação final. Teste de navegador cobre três ordens, proposta digitada, busca, limpeza, ausência de novas consultas e encerramento da sessão fictícia.
- Fonte hospedada 30ca5c4b001f62f2b6fd06105dc314bd86376343. Publicação privada solicitada pending/publishing: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_3994119fb5fc8191bc852027359ddcbf; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_78044ae7741881919973c9991c4d65cb. Confirmar status no próximo turno antes de afirmar disponibilidade. Acesso continua somente ao proprietário.
- PagBank adiado a pedido do proprietário. Nenhuma ligação, formulário externo ou novo checkout solicitado/executado.
