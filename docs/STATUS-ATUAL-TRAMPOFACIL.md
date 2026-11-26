# Estado atual recuperável — TrampoFácil

Atualização: 26/11/2026. Este resumo é o ponto de retomada atual; as entradas posteriores preservam o histórico e podem conter estados intermediários já superados.

- Repositório: luisrrcosta-cpu/trampofacil.
- Branch autorizada: codex/v16-seguranca-integracoes. Não modificar main/produção.
- Supabase autorizado: TrampoFacil-Homologacao, `asdszqtpydiowgerxwee`.
- Prévia privada: https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site . Acesso somente do proprietário.
- Último código de interface validado: `ac73b16377917222fb0b8c170c2d6f7f967e77a6`.
- Fonte hospedada atual: `aa7b8e231434e9ccf91adf62416a58f66ae769fb`.
- Publicação confirmada succeeded/ready: `appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_f0cf740c31d08191b6aa55974e8bad53`.
- CI da interface publicada: geral/interface 45863359047, financeiro 45863359051 e concorrência 45863359054, todos success. Verificações móveis anteriores: geral 45862641623 e prévia 45862641479 success.
- Commits posteriores que atualizam apenas evidências/documentação não representam novas funcionalidades.

## Entregas atuais na homologação
1. Cadastro de clientes e profissionais CPF, MEI e empresa, atividade regular ou ocasional, sem coletar números de documentos em campos públicos.
2. Autenticação normal, RLS, isolamento entre contas e catálogo restrito a perfis publicados e disponíveis.
3. Pausa/retomada de novos pedidos; alterações relevantes exigem nova análise. Contratos existentes preservados.
4. Contratação, orçamento, aceite, início, entrega, conclusão, histórico e mensagens.
5. Pedido fiscal, confirmação de atendimento, declaração de entrega e confirmação de recebimento. Não emite ou verifica notas fiscais.
6. Fila administrativa privada, aprovação por versão, orientações, recusa com motivo e auditoria; concorrência validada sem aprovar perfis existentes só para teste.
7. Nota privada de 1 a 5 após conclusão, registrada pelo cliente e visível às partes, com data em Brasília; sem comentário livre ou reputação pública.
8. Busca, filtros, resumo e ordenação dos pedidos carregados; prioridade para ações pendentes e retorno do histórico ao pedido.
9. Confirmação antes de descartar cadastro preenchido e edição de perfil ao atualizar/trocar tipo; logout limpa os dados privados.
10. Aviso de perda/retorno de conexão, sem reenvio automático. Não há persistência offline nem garantia de recuperação após fechar/recarregar a página.
11. Preparação financeira de teste e consulta autenticada da tentativa salva, sem cobrança ou repasse real.
12. Guia Como funciona pela página inicial, sem login; orientações para clientes e profissionais.
13. Pedido não enviado isolado por conta após expiração de sessão; formulário desbloqueado ao retornar do login.
14. Layout verificado em 320/360/390/768px, incluindo nomes longos e botões renderizados.

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
- Última consulta de advisors em 26/11 manteve os avisos preexistentes: INFO RLS sem políticas em tabelas privadas intencionalmente bloqueadas e WARN de proteção contra senhas vazadas. Nenhuma política reduzida.

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


## Rótulos explícitos dos seletores — 26/11/2026
- Ordenação anterior confirmada publicada succeeded/ready: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_3994119fb5fc8191bc852027359ddcbf. O filtro Aguardando minha ação já existia; não foi duplicado.
- Corrigidos 12 rótulos de select no cadastro profissional, edição de perfil, modelo de pedido, filtros, preparação de teste e simulador. Associação label for/id evita incluir opções no nome do campo. IDs preexistentes e nomes de formulário preservados; regras, valores e requisições inalterados.
- Conferência HTML: 13 seletores com rótulos explícitos únicos, sem IDs duplicados. Suíte existente de interface/regressões 45807921748, financeiro 45807921771, concorrência 45807921744 e pacote 45807921776 aprovados no commit 9fbb95869345146d5ec75ff570d97d106e3ceee1.
- Fonte hospedada cad0f39d7b2536a88b829c7ca42718fab4102e2c. Publicação privada em processamento: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_7556be11a7748191b1cfc698261d3cf2; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_c9425ed6f87c81918df8a9cd3c3829fd. Confirmar status no próximo turno. Cabeçalho identifica a última publicação já confirmada.
- Nenhum banco, permissão, produção, checkout ou pagamento alterado. PagBank permanece adiado.


## Publicação dos seletores confirmada — 26/11/2026
- Deployment appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_7556be11a7748191b1cfc698261d3cf2 confirmado succeeded/ready. Fonte cad0f39d7b2536a88b829c7ca42718fab4102e2c. Cabeçalho atualizado; anotações pending anteriores são históricas.
- Nesta retomada apenas foi conferida a publicação e atualizado o ponto de continuidade. Nenhuma nova funcionalidade, teste manual repetido, alteração de banco ou operação financeira.
- PagBank segue adiado, com tentativa incerta preservada. O aplicativo não está autorizado para pagamentos reais nem lançamento em produção.


## Proteção de orçamento ao atualizar a lista — 26/11/2026
- Identificada perda de valor de proposta ainda não enviado ao usar o botão Atualizar. Campo registra somente seu valor inicial no próprio DOM; clique manual verifica diferença ou entrada numérica incompleta antes de consultar.
- Cancelar confirmação preserva valor e cards, sem consulta. Confirmar autoriza atualização; erro de consulta conserva os cards e a edição. Campo sem alteração atualiza sem confirmação. Operação ocupada não abre nova confirmação.
- Escopo desta proteção: botão Atualizar das solicitações. Não cobre outras ações que recarregam a lista, retorno do histórico, fechamento/recarregamento do navegador ou persistência offline. Logout continua limpando os dados privados.
- Código ef29948486fcba2ec3bdf65aad2b0e08abf4eb5f; teste 8efe3a249cb9c16215ed5f7c3ca681027d3c2130. Sintaxe validada; CI geral/interface/regressões 45828513461, financeiro 45828513486 e concorrência 45828513474 concluídos success. Pacote da prévia 45828512991 aprovado na implementação.
- Teste no navegador com API fictícia: cancelamento sem GET adicional; confirmação com erro HTTP 500 conserva proposta; confirmação com consulta bem-sucedida descarta; campo vazio atualiza sem diálogo; encerramento limpa a lista.
- Fonte hospedada f7cdd8113ab117d24ec729997c569baa398c73be. Publicação privada solicitada pending/publishing: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_336c9392e73c81919ac691db9389d163; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_690739d9f1648191a8a91801a4d16c9b. Confirmar status no próximo turno antes de afirmar disponibilidade. Cabeçalho ainda identifica a última publicação confirmada.
- Nenhuma alteração de banco, acesso, produção ou pagamento. PagBank permanece adiado.


## Proteção de proposta ao navegar — 26/11/2026
- Publicação da confirmação no botão Atualizar confirmada succeeded/ready: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_336c9392e73c81919ac691db9389d163. Cabeçalho atualizado para essa última publicação confirmada.
- Reutilizada detecção de valores alterados. Abrir histórico/mensagens (inclusive sugestão de negociação) e botão Página inicial da lista agora pedem confirmação antes de descartar proposta não enviada. Cancelar conserva campos e tela; não limpa conversa nem inicia requisições. Confirmar restaura os valores iniciais e permite navegar.
- Botão Atualizar conserva comportamento anterior: confirmar não limpa antes da consulta; falha mantém edição. Logout continua limpando sem confirmação. Sem persistência após fechar/recarregar navegador; recarga causada por outras ações concluídas ainda não preserva propostas de outros cards.
- Código final de aplicação f0950ff70de0a0ef16958fee68c2a95a8f82d873; teste final 50cfdecd64d8c3d8b9f579b9b0b453b7aa299c33. CI geral/interface/regressões 45829502830, financeiro 45829502640 e concorrência 45829502628 success; pacote 45829198052 success na implementação final. Ajustes nos seletores do teste feitos antes de publicar.
- Teste móvel cobre cancelamento de histórico e saída sem consulta/sem perder valor, saída confirmada com descarte, além dos cenários de atualização anteriores.
- Fonte hospedada c901b840a226f08576aed724081f6229a274d1c2. Publicação privada solicitada pending/publishing: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_ac0ed81dd0d881919426a94a7e9cfa2a; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_6899381ade488191863393f579838e35. Conferir status no próximo turno antes de afirmar disponibilidade.
- Nenhuma alteração de banco, RLS, produção ou pagamentos; PagBank segue adiado.


## Navegação protegida publicada — 26/11/2026
- Deployment appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_ac0ed81dd0d881919426a94a7e9cfa2a confirmado succeeded/ready; fonte c901b840a226f08576aed724081f6229a274d1c2. Cabeçalho consolidado; pending anterior é histórico.
- Nesta retomada foi concluída a conferência de publicação. Sem nova implementação, reexecução manual de testes ou operação financeira.
- Próxima lacuna conhecida de propostas: recarga automática após concluir uma ação pode substituir edições não enviadas de outros cards. Antes de corrigir, definir preservação em memória condicionada ao mesmo titular, pedido, estado e versão do orçamento; nunca restaurar sobre estado atualizado de outra parte, nem manter dados após logout. Validar resposta tardia e falha sem alterar regras financeiras.
- Ambiente de execução informado indisponível nesta retomada. Não presumir nova alteração ou teste local concluído.


## Preservação de propostas em recargas automáticas — 26/11/2026
- Implementação salva na branch autorizada em 224a2ba2b6518b79be9e835c877d369a5690897d; testes finais em 0452d8f68a360a1814aad6daafaa31087e2d331c.
- Recargas automáticas recuperam apenas o valor do campo, em memória, para o mesmo ID, estado, timestamp exato e valor inicial do orçamento. Novos handlers e dados vêm da resposta atual; não transportar permissões ou closures antigas. Recuperação ocorre somente após validação de resposta e conferência da mesma sessão/versão da consulta.
- Mudança de versão/estado/valor inicial impede restauração. Entradas numéricas incompletas com badInput não são recuperadas. Pedido ausente não cria card nem rascunho persistido. Não há armazenamento local/offline.
- Atualizar manual continua com descarte explícito quando confirmado, sem restaurar a edição após sucesso; falha conserva o card. Navegação e logout mantêm as proteções/limpeza anteriores.
- CI completa: geral/interface/regressões 45832183670, financeiro 45832183722 e concorrência 45832183567 success. Prévia 45832181764 success no commit de implementação. Teste móvel verifica recarga automática da mesma versão preservando valor, timestamp novo descartando e estado aceito removendo campo; testes anteriores de confirmação e sessão permanecem aprovados.
- NÃO PUBLICADO: ambiente local indisponível, exec_command retornou No usable execution environment is available. Alteração validada e salva no GitHub, mas ainda não sincronizada com a fonte Sites. Prévia privada permanece na fonte c901b840a226f08576aed724081f6229a274d1c2, deployment ac0ed81dd0d881919426a94a7e9cfa2a já confirmado no cabeçalho.
- Próxima ação concreta quando o ambiente voltar: abrir fonte Sites pelo helper, comparar e copiar servicos.js do commit 0452d8f68a360a1814aad6daafaa31087e2d331c para dist/servicos.js; empacotar/push e publicar mantendo proprietário como único público. Não refazer testes manuais nem reenviar checkout.
- Sem alterações de banco, produção, permissões ou pagamentos. PagBank continua adiado.


## Revisão administrativa e datas de decisões — 26/11/2026
- Revisados código da autorização administrativa, aprovação, recusa e consulta privada. Controles de revisor ativo, autoavaliação, versão e consulta própria observados; não houve inspeção ou alteração das configurações remotas do banco nesta etapa.
- Melhoria de interface: datas de solicitação, orientação e recusa em Brasília com time/datetime. Limpeza após falha ou troca de conta. Sem novas consultas, permissões ou mudanças de regras.
- Código 0b5d95e27a8654c2b4550d44a11c38fa136b0852; testes ac0b91b449d9f036b67a73fb863ad538f8a66e5d. CI geral/interface/regressões 45833974781, financeiro 45833974971 e concorrência 45833974850 success; prévia 45833971649 success na implementação.
- Evidências e limites: docs/REVISAO-PAINEL-ADMINISTRATIVO-2026-11-26.md.
- NÃO PUBLICADO: ambiente local indisponível. Na retomada sincronizar tanto servicos.js pendente da preservação automática como perfil.js desta entrega. Prévia continua na fonte c901b840a226f08576aed724081f6229a274d1c2; não repetir ensaios manuais sem necessidade.
- Sem alteração de produção, SQL, banco, acesso ou pagamento. PagBank continua adiado.


## Acesso negado em decisões administrativas — 26/11/2026
- Corrigida apresentação de HTTP 403 após carregar a fila: aprovação, ajuste e recusa limpam dados/paginação e mostram área reservada, sem repetir decisão. Backend e permissões não foram alterados; a negativa já ocorria no servidor.
- Código 80297aa5ba9edaed1dcb623cab7c7f553ccec678; testes f5f4278e980f1857e0e7c7ed5425207fec66d090. CI geral/interface/regressões 45834717676, financeiro 45834717900, concorrência 45834717773 e prévia 45834715042 success.
- Testes usam API fictícia e confirmam cada uma das três decisões após negativa de acesso, limpeza da fila, controle liberado e ausência de repetição. Sem revisor ou perfil real modificado.
- Evidência atualizada: docs/REVISAO-PAINEL-ADMINISTRATIVO-2026-11-26.md.
- NÃO PUBLICADO: ambiente local indisponível. A sincronização futura deve incluir servicos.js (preservação de propostas) e perfil.js atual (datas mais tratamento de 403). A prévia continua na fonte c901b840a226f08576aed724081f6229a274d1c2; cabeçalho identifica a publicação confirmada.
- Sem alteração de banco, RLS, produção ou pagamentos. PagBank adiado.


## Busca na página de revisão administrativa — 26/11/2026
- Campo de busca por nome, serviço e cidade entre os até 50 cards carregados. Normalização de acentos/maiúsculas e combinação de termos; oculta os mesmos cards sem reconstruir formulários nem executar RPC adicional. Resultado vazio e contagem se referem expressamente à página atual, não à fila inteira.
- Busca e resultado apagados em nova carga/paginação, troca de sessão, negativa de acesso ou falha de decisão que limpa os cards. Controles aparecem apenas após uma fila autorizada com perfis. Limpar busca restaura cards e devolve foco ao campo.
- index.html 0f13b433a54b053e2645e823ccf57cfc22ed6daf; perfil.js final e0f360ca9163ef1efb93965e6bf09c38a74a6ea1; testes finais 02b9aa082c7de58ba67d78b0c733069d8638df41. CI geral/interface/regressões 45835566499, financeiro 45835566317 e concorrência 45835566367 success. Pacote 45835420641 success na implementação final. Teste com dois perfis valida busca combinada/acento, resultado vazio, limpeza sem nova consulta e tratamento de 403 de cada decisão sem estado de busca residual.
- NÃO PUBLICADO: correção salva e validada no GitHub. Sincronização futura deve incluir index.html, perfil.js e servicos.js atuais da branch, preservando os rótulos, datas, negativa de acesso e rascunhos já validados. Prévia mantém fonte c901b840a226f08576aed724081f6229a274d1c2 até nova publicação confirmada.
- Sem consulta ou mudança do banco remoto, permissões, produção ou pagamentos. PagBank permanece adiado.


## 26/11 — Auditoria de revisão e publicação privada iniciada

Auditoria somente de leitura em TrampoFacil-Homologacao (asdszqtpydiowgerxwee): cinco tabelas internas de revisão com RLS ativa e sem SELECT/INSERT/UPDATE/DELETE direto para authenticated; anon sem SELECT; schema private sem USAGE para ambas as funções de acesso. As 13 funções de revisão verificadas correspondem aos corpos SQL versionados (normalização de comentários e espaços). Wrappers públicos são invoker; funções revisao_admin são definer, com search_path vazio e execução restrita conforme os grants examinados. Foram verificadas as guardas de revisor ativo, impedimento de decisão sobre o próprio perfil e versão esperada. Nenhuma decisão administrativa ou alteração de banco foi executada. Isto não substitui teste completo autenticado via HTTP. Advisors mantêm avisos conhecidos: tabelas internas com RLS sem políticas e proteção contra senhas vazadas desativada; nenhuma configuração de Auth foi alterada.

Sincronizados os três arquivos já testados: index.html (4897677e3b48c74c378e6ee733d18c4d4a3ce0f2), perfil.js (76f0ca09a7e74ad9b30202920fbb41056f90566a) e servicos.js (b354a265dbe3e458f7c66111b6b12c0f9c03110a). Busca local no painel, datas de revisão, limpeza por acesso negado e preservação de proposta em atualização automática incluídas. Verificação de sintaxe JavaScript e git diff --check aprovadas; testes anteriores permanecem aplicáveis aos mesmos blobs.

Fonte privada enviada: 0342e21c7db4480104ca738acb09cb9559f6820c. Versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_b7dfb6fd84d08191ac5315e7a7f02a2d. Publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_2f6d2b938f78819189acc918ba8c601b: pending/publishing no retorno inicial. Ainda não confirmada como publicada. URL: https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site. Confirmar estado na próxima retomada, sem iniciar outra publicação. Produção e pagamentos reais permanecem inalterados; tentativa PagBank incerta não repetida.


## 26/11 — Publicação das melhorias confirmada

Consulta posterior confirmou succeeded/ready da publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_2f6d2b938f78819189acc918ba8c601b, versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_b7dfb6fd84d08191ac5315e7a7f02a2d. Busca na página de revisão, datas, tratamento de acesso negado e preservação de propostas nas atualizações automáticas estão incluídos na fonte privada 0342e21c7db4480104ca738acb09cb9559f6820c. Estado pending anterior superado. Não foi realizado novo teste manual autenticado de ponta a ponta nesta confirmação.


## 26/11 — Aviso antes de perder proposta ao fechar a aba

Implementação 408f01e7787f6ff9a4e8b7efbf07ee887c242a4c; testes 9bb5e675b3bb7cb6b7ea9a0c7f3107730f520680. beforeunload solicita aviso nativo se uma conta conectada está na lista com valor de proposta alterado e não enviado. Valor inicial/restaurado e proposta confirmada não geram aviso. O navegador determina a exibição; fechamento abrupto, especialmente em celular, pode não disparar o evento. Nenhum rascunho foi persistido e nenhuma proposta é enviada automaticamente.

CI success: geral/interface 45859041441, financeiro 45859041476, concorrência 45859041404. Teste de interface verifica cancelamento do evento para edição e remoção da proteção ao restaurar/confirmar. Sintaxe JavaScript e git diff --check aprovados.

Fonte privada 42e981d22339d1efdde99968e0a3a734f53bca5b, versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_d2013d438af081918018516cc5c48a2c, publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_2baacf6f68588191a14589fa65c7d651: pending/publishing. Confirmar na próxima retomada; a fonte confirmada no cabeçalho permanece a anterior até confirmação. Sem alterações no banco, produção ou pagamentos.


## 26/11 — Aviso de saída confirmado na homologação

Publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_2baacf6f68588191a14589fa65c7d651 confirmada succeeded/ready. Fonte 42e981d22339d1efdde99968e0a3a734f53bca5b. CI geral/interface 45859041441, financeiro 45859041476 e concorrência 45859041404 success. O estado pending anterior está superado. Sem novo teste manual autenticado nesta confirmação.


## 26/11 — Privacidade do pedido após sessão expirada

Corrigido vazamento potencial de preenchimento entre contas: o formulário mantém titular em memória; após expiração, o novo login do mesmo usuário preserva título/descrição e tentativa idempotente. Login de outro usuário limpa formulário, contador, status e tentativa anterior antes de mostrar a tela. Logout explícito limpa também o titular. A seleção pública do profissional pode permanecer, mas nenhum texto privado da conta anterior é reapresentado. Nenhum armazenamento persistente adicionado.

Corrigido também formulário que permanecia desativado após 401: a troca de sessão libera os controles da nova solicitação, mantendo guardas contra respostas atrasadas. Teste com API simulada verifica POST 401, retorno do titular com texto e controles habilitados, troca para outra conta com campos vazios e chave anterior removida; somente um POST, sem reenvio automático.

Código final 825e38d1862fef3b6e10f535895526328e3c98cb; testes dd111bb6f9b2c0378332d1dc03100e8d9e9ce82c. CI success: geral/interface 45860446844, financeiro 45860446935, concorrência 45860446808. Sintaxe JavaScript e git diff --check aprovadas. Sem alteração de banco, RLS, produção ou pagamentos.

Fonte privada 4af74b7956611d21ac24e8b789bc57c33db3cb15. Versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_6c0acdc670e8819184e446ff45e811e9; publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_e9333b5fc4c0819189e4ef1fc16a09fd: pending/publishing. Confirmar na próxima retomada; não presumir publicada nem criar nova publicação para conferir estado.


## 26/11 — Correção de sessão e privacidade publicada

Confirmado succeeded/ready para appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_e9333b5fc4c0819189e4ef1fc16a09fd, fonte 4af74b7956611d21ac24e8b789bc57c33db3cb15. Preservação do texto para o titular, limpeza ao trocar de conta e desbloqueio do formulário após sessão expirada incluídos. CI geral/interface 45860446844, financeiro 45860446935 e concorrência 45860446808 success. Estado pending anterior superado. Sem novo teste manual autenticado nesta confirmação.


## 26/11 — Telas estreitas e nomes longos

CSS permite quebra de palavras em h1/h2/h3/h4, botões e labels; hash CSP recalculado sem relaxar a política. Código e701d488ac93af084a4e2f25a32a038b730bd2a6. Teste automatizado em Chromium com viewport móvel/toque verifica 320, 360, 390 e 768px: telas inicial, cadastro cliente/profissional, login, novo pedido, lista e simulador sem overflow horizontal; botões renderizados dentro da tela e altura >=40px. Catálogo simulado inclui nome sem espaços com 120 caracteres. Não representa teste em aparelho físico nem todos os estados autenticados.

Primeira execução 45862366634 detectou falha no teste ao medir botões de grupos ocultos; filtro corrigido para elementos renderizados no commit 42be85ede5d9e10e89a79200877b9e4bd1821e0f. Execução final geral/interface 45862641623 success, financeiro 45862641565 success, concorrência 45862641467 success, prévia 45862641479 success. git diff --check aprovado.

Fonte privada 333965503c027496e20c25c8a3864f068370316c; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_1c362985f314819183917ba3a176cb86; publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_5600da86293c8191ae3f88f227b8111f: pending/publishing no retorno inicial. Confirmar na próxima retomada. Nenhuma alteração de dados, segurança de acesso, produção ou pagamentos.


## 26/11 — Ajuste para celular publicado

Publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_5600da86293c8191ae3f88f227b8111f confirmada succeeded/ready. Fonte 333965503c027496e20c25c8a3864f068370316c. Estado pending anterior superado. Testes móveis automatizados e regressões aprovados conforme evidência anterior; sem novo teste em aparelho físico nesta confirmação.


## 26/11 — Guia Como funciona

Tela acessível na página inicial, sem login ou consultas ao banco. Explica contratação pelo cliente, cadastro e análise do profissional, orçamento, acompanhamento e conclusão; esclarece indisponibilidade de pagamentos online e o papel limitado do acompanhamento fiscal. Sem novas operações ou permissões. Código 4f7c9b63a63f5dd9556d0646b1468daaf4601598; testes 670457fd3dcb588dac3a156f69c5f0520fff2028.

Testes verificam abertura, foco no título, retorno à página inicial e zero chamadas API; guia incluído nas verificações de largura 320/360/390/768px. CI success: geral/interface 45863359047, financeiro 45863359051, concorrência 45863359054. git diff --check aprovado; CSS e CSP preservados.

Fonte privada 74d7f208d51520698622601a86bfe346d64a9838. Versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_6dee5b17655881918bf1f6f8c1e411c9; publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_3600bc2a2a3081919469a62a20d41c45: pending/publishing. Confirmar na próxima retomada; não afirmar publicada antes de succeeded. Produção e pagamentos inalterados.


## 26/11 — Guia confirmado como publicado

Publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_3600bc2a2a3081919469a62a20d41c45 confirmada succeeded/ready. Fonte 74d7f208d51520698622601a86bfe346d64a9838. Guia Como funciona disponível pela página inicial privada; pending anterior superado. CI geral/interface 45863359047, financeiro 45863359051 e concorrência 45863359054 aprovados conforme registro anterior. Nenhuma operação financeira ou alteração de produção nesta confirmação.


## 26/11 — Ensaio privado preparado, sem abertura de acesso

Roteiro salvo em docs/ROTEIRO-ENSAIO-PRIVADO-SEM-PAGAMENTOS.md, cobrindo cliente/profissional, revisão autorizada de perfil fictício, contratação, mensagens, conclusão, isolamento entre contas e recuperação no celular. Preparação documental apenas; nenhum convite, ampliação de audiência, ensaio com novos participantes ou operação financeira executado. Acesso continua somente do proprietário. Seleção do grupo e autorização concreta de acesso ficam para antes da execução externa.


## 26/11 — Permissões do fluxo principal conferidas

Revisão somente de leitura de clientes, profissionais, solicitações, mensagens e histórico: RLS ativa; anon sem SELECT direto; authenticated sem DELETE. Predicados de titularidade/participação e políticas restritivas de autenticação conferidos. Catálogo ativo separado e busca invoker limitada a campos públicos. Evidência em docs/PERMISSOES-FLUXO-PRINCIPAL-2026-11-26.md. Não é teste autenticado completo nem auditoria de produção. Nenhum dado, grant, política, convite ou pagamento alterado.


## 26/11 — Paginação da busca limitada também no banco

Aplicada somente na homologação a função buscar_profissionais com página máxima 10000 e OFFSET limitado, preservando páginas negativas/nulas como primeira página, retorno de até 20 registros com os mesmos cinco campos públicos e permissões existentes. Código 2bd0d4dc72e0d9f32f5fec17ec95f49714a60845; testes 2e957e83dee3cdc196e14a7eb64e37e0ba09285d. CI geral 45873994148, financeiro 45873995111 e concorrência 45873994052 aprovados. Verificação READ ONLY sob anon após aplicação aprovada; invoker/search_path/grants preservados. Evidência: docs/LIMITE-PAGINACAO-HOMOLOGACAO-2026-11-26.md. Nenhum dado, acesso do site ou pagamento alterado.


## 26/11 — Botão de paginação alinhado ao limite do banco; publicação pendente

Código 60755cce9be14a366bfcea6a2dd381c05213876a: Ver mais fica oculto quando pagina >= 10000, mesmo com página completa. Testes ace86c1651dfed05a07d0c7d22374b951025da22 simulam páginas 0 e 10000 com 20 registros distintos cada, conferem manutenção dos 40 cards, botão oculto e ausência de chamada para 10001. CI geral/interface 45874509075, financeiro 45874507640 e concorrência 45874507587 success.

A alteração da tela ainda NÃO foi publicada: executor indisponível impediu preparar/enviar a fonte Sites. Próxima retomada: sincronizar somente servicos.js a partir do blob 6b4d65a7d818ad38f3f6907a019afa212233bf8e, validar estado remoto e publicar via helper habitual na homologação privada. Fonte hospedada confirmada continua 74d7f208d51520698622601a86bfe346d64a9838. O limite no banco já está aplicado e verificado; pagamentos e audiência não foram alterados.


## 26/11 — Azul escuro e laranja forte solicitados pelo proprietário

Paleta em index.html, commit c3d894f8fdf577f787c439a571a18b265ed79f31: cabeçalho azul-marinho #0b1f3a / #173f70, títulos/ações secundárias #12345b, botões e acentos laranja #ff7900 com texto #102b50. Cartões brancos preservados, voltar em azul claro, buscas populares em laranja suave. Hash CSP atualizado sem relaxar política. Prévia local inspecionada visualmente no navegador; contraste calculado de texto azul sobre laranja 5,38:1, branco sobre azul 12,59:1 e azul sobre laranja claro 11,29:1.

CI geral/interface 45885674266, financeiro 45885674089, concorrência 45885674054 e prévia 45885674031 success. git diff --check aprovado. Publicação também inclui servicos.js blob 6b4d65a7d818ad38f3f6907a019afa212233bf8e (limite do botão Ver mais), já validado anteriormente e pendente do executor.

Fonte privada enviada 8c4497fa2ad0d25e5cad3731e2f8714a7d89e91b. Versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_7ed76b46aab881918de986198b908c26; publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_953a2bb3e398819195fadc48ed2847b4: pending/publishing. Confirmar na próxima retomada; não marcar como publicada antes de succeeded. Não houve alteração de dados, produção, audiência ou pagamentos.


## 26/11 — Modelo escolhido: azul-marinho, letras brancas e detalhes laranja

Primeira paleta confirmada succeeded/ready na publicação 953a2bb3e398819195fadc48ed2847b4 (identificador completo no cabeçalho), incluindo ajuste pendente do botão Ver mais. Proprietário preferiu a sugestão 1 após avaliar o laranja predominante.

Nova alteração CSS em 825a491e5fdab3216f0692928eee017a614c66d2: botões #12345b com texto branco e bordas de 2px #ff7900; Voltar preserva fundo claro/texto azul e borda discreta. Cabeçalho azul e acentos laranja preservados. Hash CSP atualizado sem relaxamento. Contraste branco/azul já calculado em 12,59:1. Inspeção visual da prévia confirmou o modelo. CI geral/interface 45886474111, financeiro 45886474195, concorrência 45886474168 e prévia 45886474286 success; git diff --check aprovado.

Fonte privada nova 4bfc4b983adc3d77d39bd21901f048b5a858a493. Versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_d0d902754e5c819192357c251be7a14c; publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_79a8bf9f5cec8191b7bf2e0873714494: pending/publishing. Confirmar na próxima retomada; cabeçalho permanece com última publicação confirmada até succeeded. Sem alterações funcionais, dados, acesso ou pagamentos.


## 26/11 — Destaque laranja no título de boas-vindas

Modelo de botões azul/branco confirmado succeeded/ready antes desta edição. A pedido do proprietário, título inicial mantém Bem-vindo ao em azul e destaca TrampoFácil! em #c45100, com faixa decorativa #ff7900 abaixo. Texto acessível do heading preservado; alteração somente visual. CSS/CSP conferidos, git diff --check aprovado. Código ac73b16377917222fb0b8c170c2d6f7f967e77a6; CI geral/interface 45886924354, financeiro 45886924175, concorrência 45886924201 e prévia 45886924405 success.

Fonte nova aa7b8e231434e9ccf91adf62416a58f66ae769fb, versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_941e7e704f4c8191bc0886e101f05409, publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_f0cf740c31d08191b6aa55974e8bad53: pending/publishing. Confirmar na próxima retomada; ainda não presumir publicada. Sem mudanças de dados, permissões, funcionalidade ou pagamentos.


## 26/11 — Apresentação dos profissionais e suporte por e-mail

Proprietário aprovou visual azul-marinho/branco com detalhes laranja e título destacado. Publicação anterior do título confirmada succeeded/ready. Proprietário informou ter enviado e-mail ao suporte PagBank; não há resposta/protocolo técnico confirmado nesta conversa. Manter tentativa sandbox incerta sem reenvio.

Melhoria autorizada do catálogo: iniciais decorativas sem foto inventada; nome, serviço e cidade destacados; descrição longa com resumo e details nativo para texto completo. Somente mesmos dados públicos, renderizados com textContent, sem avaliações públicas, selo de verificação ou informações pessoais adicionais. CSS/CSP atualizados. Commits HTML 1ac27e19afd5592d468fd5fd87a1648471b4cf1e e JS a8c79441847f9790d92c3008346da713f6871d09; testes finais 411f4c5bba7056a0f7d9087efeb00910a4b031f3. CI geral/interface 45896838367, financeiro 45896838374 e concorrência 45896838364 success. Testes móveis incluem abrir/fechar descrição completa, preservar quebras e evitar overflow nas quatro larguras. Sintaxe JS e git diff --check aprovados.

Fonte nova 057b11c1c8ef0f15e31ee173fb949e5a7fa5bdb4. Versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_6fd76a28df0481919147dc2ace788e07; publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_b314f55a4c688191a625eaa32bb19978: pending/publishing. Confirmar na próxima retomada. Sem mudança de banco, audiência ou pagamentos.

Durante esta entrega, proprietário perguntou sobre garantia/reclamação/reembolso. Foi consultado CDC arts.20/24/26/49 e orientação Procon-SP. Nenhuma política de disputa, retenção, repasse ou estorno implementada automaticamente; isso depende de definição operacional e revisão jurídica aplicável. Prazo legal de reclamar não equivale a reembolso automático ou prazo de repasse.


## 26/11 — Reclamações privadas e risco de repasse

Proprietário autorizou implementar atendimento de reclamações e estudar proteção contra reembolso após repasse. Entrega funcional apenas na homologação: relato inicial do cliente por pedido, resposta inicial do profissional e fila administrativa para revisor ativo já existente. Partes não alteram/apagam relatos, autoria e data protegidas; sem anexos. Nenhuma decisão, notificação, SLA, bloqueio bancário, liberação, repasse ou reembolso automático implementado. Consultar docs/RECLAMACOES-REPASSES-HOMOLOGACAO.md para escopo e pendências de custódia/reserva/contrato.

Migração supabase/migrations/20261126214707_reclamacoes_servico_homologacao.sql aplicada somente no projeto asdszqtpydiowgerxwee. Verificação: RLS nas duas tabelas, seis políticas, sem autoria inserível pelo cliente, sem UPDATE ou leitura anônima; advisors sem novos achados. Nenhum pedido ou valor alterado e nenhum relato real criado em testes. PagBank sandbox incerto intocado.

Código d1f91ace8515ae0c368ea6bb58fe57e8921f11c1; ajuste da validação de scripts 25ab0359d953e3687e5eec7ee995f9256281722b. CI geral/interface 45901158169, financeiro 45901158142, concorrência 45901158084 e prévia 45901158158 success; suíte anterior mesmo código funcional passou 267 testes e regressões. Browser local indisponível por binário ausente/download bloqueado; testes reais Chromium com API simulada executados e aprovados no CI. Arquivos publicados comparados byte a byte com os testados; git diff --check aprovado.

Catálogo anterior confirmado succeeded/ready antes desta entrega. Nova fonte privada b4a62886df49a799fa742f453024cd0485de7de6; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_dfb34035681c8191bc456f940e0f9ad3; publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_5eb7d79f3bdc8191b48e2a818798997d: pending/publishing. Publicação ainda não confirmada; verificar uma vez na próxima retomada, sem presumir publicada. Audiência owner-only preservada. Sem alterações na produção ou pagamentos reais.


## 26/11 — Andamento, respostas administrativas e histórico de reclamações

Publicação anterior de reclamações confirmada succeeded/ready antes desta entrega. A pedido do proprietário, acompanhamento acrescenta status Aguardando análise / Em análise / Atendimento concluído, respostas administrativas visíveis às partes, conclusão e reabertura sem apagar eventos. Conclusão é apenas do atendimento, sem reembolso, quitação financeira ou limitação de direitos. Consulta manual do histórico paginada por versão; avisos/notificações automáticas ainda não implementados.

Migração supabase/migrations/20261126220117_acompanhamento_reclamacoes_homologacao.sql aplicada somente a asdszqtpydiowgerxwee. Verificados RLS, duas políticas, sem INSERT/UPDATE/DELETE direto nem leitura anônima; wrappers públicos invoker e funções internas definer com search_path vazio. Sem novos advisors (9 INFO private sem política + 1 WARN proteção de senhas anterior permanecem). Nenhuma exclusão de dados, evento real de atendimento criado ou movimentação financeira. Tentativa PagBank incerta preservada.

Código funcional 8cb57b483ab2484d7ecc1e6800c54059170a2da3; teste concorrente fe9b08e20b04afdcdc8c5fb02d1a0edb63e17576; fixture HTTPS corrigida 79cbb548a5694dbf98d410bbecbaf1a3d025b8a1; texto de acompanhamento 614e2387f8cd8c26f8ca02e893d260cc92792ebd. CI final: geral/interface 45902696070, financeiro 45902696002, concorrência 45902696012 e prévia 45902696033 success. Suíte anterior funcional passou 269 testes e regressões; mesmo código de testes no CI final. Concorrência PostgreSQL comprovou disputa de lock em conexões independentes, idempotência, conflito de revisão e revogação. Browser testa envio incerto, conclusão, 60 eventos em duas páginas, HTML inerte e troca de sessão. git diff --check aprovado; fonte de interface comparada aos arquivos testados. Ver docs/RECLAMACOES-REPASSES-HOMOLOGACAO.md.

Fonte privada 9e680a00a35a33cb8a59ddd44280c8aabc336207. Versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_4e83672428988191825c721f2c9d3e69; publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_7abf986c31e081919a4f044a8a43b902: pending/publishing. Ainda publicando; confirmar uma vez na próxima retomada. Audiência owner-only preservada; nenhum pagamento real habilitado.


## 26/11 — Meus avisos: respostas e atualizações de atendimento

Publicação anterior de acompanhamento confirmada succeeded/ready. Entrega nova na homologação: Meus avisos lista a resposta inicial do profissional para o cliente e atualizações administrativas para ambas as partes. Consulta ao abrir a área ou Atualizar avisos, marcação individual de leitura, resumo de não lidos entre itens exibidos e atalho Ver solicitação. Paginação estável por cursor composto, 50 itens mais sentinela. Sem envio externo ou alertas em segundo plano; novos pedidos e mensagens de conversa ainda fora desta entrega.

Código 45105ee26c01fc89cd9498bbd661e8c2c31de463. Migration supabase/migrations/20261126222715_avisos_atendimento_homologacao.sql aplicada somente em asdszqtpydiowgerxwee. Recibos privados com RLS, sem privilégios diretos de leitura/escrita para authenticated/service_role; função de leitura confere destinatário por auth.uid(), sem parâmetros de outro usuário ou horário. Funções invoker públicas e definer internas com search_path vazio. RPCs sem execução por anon. Advisors sem novos achados: 9 INFO e 1 WARN anteriores mantidos. Nenhuma exclusão de dados, leitura real criada em testes ou movimentação financeira; tentativa PagBank incerta intocada.

CI geral/interface 45905274412 passou 271 testes e regressões; financeiro 45905274351, concorrência 45905274318 e prévia 45905274448 success. Testes novos cobrem destinatários, leitura individual/idempotente, cursor com empate de horário e microssegundos, acesso negado a terceiros/anônimos, perda de resposta sem repetição automática, paginação de 60 avisos, navegação, texto inerte e descarte de resposta após troca de sessão. Arquivos de interface comparados aos testados; git diff --check aprovado. Detalhes em docs/RECLAMACOES-REPASSES-HOMOLOGACAO.md.

Fonte privada 7d1538bb563eec9109a16d0a3ca5e663e1989edf. Versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_08e3df8b8a1c8191a9e12795e5e2a82a; publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_c0f5d607c0dc8191ab6d5fbddf793af2: pending/publishing. Ainda publicando; confirmar uma vez na próxima retomada, sem presumir publicada. Acesso owner-only preservado. Sem mudanças na produção ou pagamentos reais.


## 26/11 — Avisos das etapas de contratação

Publicação anterior de Meus avisos confirmada succeeded/ready. Nova entrega inclui solicitações, propostas, aceite, início, entrega, conclusão e cancelamento, derivados exclusivamente de historico_solicitacoes existente. Destinatário é a contraparte; autor não recebe aviso da própria ação, terceiros/revisores fora do pedido não recebem avisos. Tipos/status desconhecidos e atores alheios às partes são ignorados. Eventos antigos elegíveis também aparecem com horário original. Consulta manual; sem push ou envio externo. Conversas ainda não incluídas.

Código a28120d71c545b3ce5808c82f876350b6a22d98a. Migração supabase/migrations/20261126223635_avisos_contratacao_homologacao.sql aplicada somente em asdszqtpydiowgerxwee. CHECK dos tipos de recibo ampliado com contratacao, mantendo tipos anteriores, RLS, chave e privilégios; apenas funções internas de listagem/marcação alteradas. Triggers registrar_solicitacao e validar_solicitacao preservados; nenhum pedido, histórico ou valor alterado. Verificação pós-migração e advisors sem novos achados (9 INFO/1 WARN anteriores mantidos). Sem registros reais criados em testes, exclusão de dados ou efeitos financeiros. Tentativa PagBank incerta intocada.

CI geral/interface 45906109802 passou 273 testes e regressões. Financeiro 45906109794, concorrência 45906109829 e prévia 45906109804 success. Testes novos validam todas as etapas e rótulos, destinatários, ações próprias excluídas, privacidade, leitura idempotente, cursor com empate de horário, perda de resposta, paginação, navegação e saída/troca de sessão. Índices existentes conferidos. Fonte de interface comparada aos arquivos testados; git diff --check aprovado. Detalhes em docs/RECLAMACOES-REPASSES-HOMOLOGACAO.md.

Fonte privada abfc20f58c29f3637602096d12665d2c1f59d785; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_bdb652ed04b8819183438b760812f8a4; publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_9aab148fce608191a5088505f3a101ac: pending/publishing. Ainda publicando; confirmar uma vez na próxima retomada, sem presumir publicada. Owner-only preservado. Pagamentos reais continuam desativados.
