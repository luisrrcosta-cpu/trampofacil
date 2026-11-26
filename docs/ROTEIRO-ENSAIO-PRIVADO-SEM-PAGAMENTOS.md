# Ensaio privado sem pagamentos — TrampoFácil

Preparado em 26/11/2026. Roteiro ainda não executado com novos participantes. Acesso continua somente do proprietário. Não substitui evidências financeiras nem autoriza lançamento.

## Versão de referência

Fonte hospedada cc2cdaa9ed06fe24879a10384675e22ab50536e4, publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_567a082bf174819199b830390287e371 confirmada succeeded/ready em 26/11. Código funcional fd363a0f15d6da1a8c36a4a18d0bafb64ba5ee9a. CI geral/interface 45911469716 consultada: 277 testes e regressões aprovados. Endereço: https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site . Branch codex/v16-seguranca-integracoes; banco TrampoFacil-Homologacao. Não usar produção.

## Preparação

- Usar identidades de teste separadas para cliente, profissional e outra conta sem participação no pedido.
- Os e-mails de acesso precisam pertencer a quem realiza o teste; os dados de perfil e serviço devem ser fictícios. Não inventar um e-mail de terceiro para receber códigos.
- Não pedir senha, código de acesso ou token de outra pessoa. Cada participante entra na própria conta.
- Não cadastrar documentos, endereço completo, dados bancários ou serviços reais.
- Qualquer decisão de revisão necessária deve ser feita por revisor autorizado sobre o perfil fictício escolhido, após autorização específica para esse ensaio. Não aprovar perfis existentes apenas para abrir caminho ao teste.
- Não enviar convites nem modificar a audiência do site nesta preparação. Antes de teste externo, selecionar participantes, confirmar que o mecanismo de acesso disponível comporta o grupo e obter autorização para a alteração concreta.
- Não reenviar o checkout incerto nem criar tentativa financeira para este roteiro.

## Cenário de uso

| Passo | Papel | Ação | Resultado esperado |
| --- | --- | --- | --- |
| 1 | Todos | Abrir Como funciona e voltar | Orientações legíveis; retorno à página inicial sem login |
| 2 | Profissional | Completar cadastro fictício e solicitar análise | Perfil pendente, sem publicação automática |
| 3 | Revisor autorizado | Revisar apenas o perfil fictício selecionado, se essa etapa for autorizada | Decisão por versão; orientação clara em caso de ajuste |
| 4 | Cliente | Buscar serviço e cidade e selecionar o profissional de teste disponível | Apenas perfil publicado e disponível aparece |
| 5 | Cliente | Criar pedido identificado como TESTE, sem dados pessoais | Um pedido; dados preservados após falha sem duplicação |
| 6 | Profissional | Abrir pedido, escrever mensagem e enviar orçamento de teste | Cliente vê proposta e histórico; nenhuma cobrança |
| 7 | Cliente | Conferir valor, conversar e aceitar | Orçamento aceito; pagamento online continua indisponível |
| 8 | Profissional | Registrar início e entrega fictícios | Estado correto; cliente consegue acompanhar |
| 9 | Cliente | Conferir e concluir o serviço fictício | Conclusão registrada e avaliação privada disponível |
| 10 | Cliente/profissional | Consultar pedido fiscal somente em cenário fictício | Textos distinguem solicitação, declaração e recebimento; nenhuma nota emitida |
| 11 | Cliente | Registrar um problema fictício no mesmo pedido, pela área Problemas e reclamações | Um relato inicial privado, com referência do pedido; sem estorno ou bloqueio bancário |
| 12 | Profissional | Consultar o relato e registrar resposta fictícia | Cliente e profissional veem o mesmo registro; terceiros não |
| 13 | Atendimento autorizado | Iniciar análise, responder, concluir e reabrir apenas o caso fictício selecionado, no ensaio autorizado | Histórico preservado; revisor participante não decide o próprio caso; sem ação financeira |
| 14 | Cliente/profissional | Abrir Meus avisos e atualizar após ações da outra parte | Pedido/proposta/etapas, mensagens e atendimento aparecem somente para destinatário; sem push externo |
| 15 | Cliente/profissional | Marcar um aviso como lido e comparar as contas | Leitura só da conta atual; não é confirmação enviada à outra parte |
| 16 | Participantes | Usar Ver solicitação/Abrir conversa e os atalhos de ajuda | Pedido indicado em foco, ajuda atualizada e conversa sem envio automático; mensagens antigas podem exigir páginas anteriores |
| 17 | Outra conta | Abrir sua lista e tentar consultar o pedido, reclamação, histórico e aviso pela rota autorizada de QA | Sem conteúdo alheio; sem decisão administrativa ou marcação de leitura de outro usuário |
| 18 | Participantes | Sair da conta | Pedidos, mensagens, reclamações e avisos privados deixam de ser exibidos |

Não declarar entrega de nota ou recebimento real: usar apenas evidência fictícia, se o cenário for executado. O ensaio não envolve prestação real de serviço.

## Celular e recuperação

- Verificar legibilidade, botões, teclado e dúvidas expansíveis no aparelho utilizado; não confundir testes automatizados de viewport já aprovados com teste em aparelho físico.
- Os testes automatizados já cobrem abrir um pedido fora dos primeiros 50 via aviso, limpar filtros que o ocultavam, preservar cursor/ordem e evitar duplicação. Não criar 50 pedidos persistidos só para repetir essa evidência. Reproduzir manualmente apenas se houver ocorrência nova ou dados fictícios adequados já disponíveis.
- Conferir que o corpo das mensagens permanece na conversa: o aviso de mensagem usa texto genérico, sem cópia do conteúdo.
- Atendimento concluído não é serviço concluído nem confirmação financeira. Consultar o histórico para verificar a resposta, sem supor reembolso.
- Editar proposta e cancelar uma saída: valor permanece. Aceitar descarte: valor volta ao estado carregado.
- Para sessão expirada, verificar a mesma conta recuperando o pedido não enviado e outra conta recebendo campos vazios.
- Interromper a conexão em teste controlado e conferir resultado antes de repetir. Nenhum envio automático deve ocorrer.
- Mensagem de resultado incerto exige consulta antes de tentar enviar de novo.
- Não prometer recuperação depois de fechar/recarregar a aba. Rascunhos não têm persistência offline.

## Registro dos resultados

Para cada ocorrência, anotar: passo, papel, aparelho/navegador, horário, ação, resultado esperado e observado. Usar referência fictícia do pedido e captura recortada sem e-mail, telefone, código ou token.

| Critério de encerramento | Evidência necessária |
| --- | --- |
| Fluxo principal | Cliente e profissional concluem o mesmo pedido fictício |
| Privacidade | Conta externa ao pedido não acessa pedido, conversa, avaliação, reclamação ou avisos |
| Recuperação | Falha não causa reenvio automático ou duplicação |
| Celular | Ações essenciais acessíveis no aparelho escolhido |
| Financeiro | Nenhuma cobrança, repasse ou novo checkout enviado |
| Atendimento | Relato, resposta e histórico administrativo acessíveis apenas às partes e atendimento autorizado |
| Avisos | Destinatário correto, leitura individual e navegação sem envio automático |
| Pendências | Falhas bloqueadoras registradas antes de ampliar o grupo |

## Situação desta preparação

Preparação documental atualizada em 26/11 para a versão atual; não é execução do ensaio. Nenhuma conta, perfil, pedido, avaliação, decisão administrativa, convite, configuração de acesso ou operação financeira foi criada ou alterada por este roteiro. Execução com novos participantes ainda depende de seleção do grupo e autorização de acesso. Não repetir evidências autenticadas já concluídas sem uma mudança ou objetivo novo.
