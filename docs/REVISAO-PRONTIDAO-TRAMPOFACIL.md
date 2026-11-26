# Revisão de prontidão — TrampoFácil

Atualizada em 26/11/2026, após a entrega da ajuda operacional. Exame da homologação asdszqtpydiowgerxwee; não é aprovação de produção ou lançamento comercial.

## Versão confirmada

- Branch: codex/v16-seguranca-integracoes. Produção/main não alteradas.
- Último código funcional: fd363a0f15d6da1a8c36a4a18d0bafb64ba5ee9a.
- Fonte hospedada: cc2cdaa9ed06fe24879a10384675e22ab50536e4.
- Publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_567a082bf174819199b830390287e371 confirmada succeeded/ready nesta revisão.
- Prévia: https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site . Somente o proprietário; nenhum convite ou acesso novo concedido.
- CI 45911469716: 277 testes aprovados e regressões aprovadas. Financeiro 45911469918, concorrência PostgreSQL 45911469788 e prévia 45911469784: success. São verificações do código com ambientes isolados/API simulada, não pagamento completo no provedor.

Referências anteriores deste arquivo foram consolidadas; o histórico detalhado permanece no STATUS-ATUAL-TRAMPOFACIL.md e nos documentos de cada entrega.

## Evidências e limites

| Área | Evidência disponível | Limite ou próxima condição |
| --- | --- | --- |
| Cadastro e acesso | OTP e identidades validados anteriormente em homologação; testes de saída, recuperação e isolamento | Não repetir acesso manual já validado sem objetivo novo. Auth/produção não auditados por esta revisão |
| Profissionais e catálogo | Cadastro inclusivo, análise por versão, ajustes, recusa, pausa e publicação de perfil | Publicação não comprova documentos, identidade ou habilitação |
| Contratação e conversa | Pedido, proposta, aceite, início, entrega, conclusão/cancelamento, histórico e mensagens testados | Aceite/conclusão não comprovam pagamento; não há funcionamento offline ou rascunho persistente após fechar a aba |
| Atendimento de reclamações | Relato inicial, resposta profissional, análise/resposta administrativa, conclusão e reabertura com histórico | Consulta manual; não atribui atendente ou SLA, não decide/reembolsa automaticamente e não bloqueia dinheiro |
| Avisos dentro do aplicativo | Pedidos/propostas/etapas, mensagens, resposta profissional e atualizações administrativas; leitura individual e paginação | Consultados ao abrir/atualizar; sem e-mail, WhatsApp, push ou alerta em segundo plano. Marcar aviso não confirma leitura à contraparte |
| Uso móvel | Navegador com viewports 320/360/390/768px, pedidos antigos a partir de avisos, filtros, foco, ordenação e paginação | Não equivale a ensaio em aparelho físico com novos participantes |
| Ajuda operacional | Como funciona atualizado, dúvidas expansíveis e atalhos em solicitações/avisos | Descreve o sistema atual; não cria termos jurídicos, prazo de garantia ou promessa financeira |
| Nota fiscal | Solicitação, declaração de entrega e confirmação de recebimento testadas | Não emite nem verifica documento fiscal |
| Avaliação | Nota privada de 1 a 5 após conclusão | Não é reputação pública ou selo de verificação |
| Ensaio privado | Roteiro atualizado com todos os fluxos atuais | Ainda não executado com novos participantes; audiência owner-only preservada |
| Checkout PagBank | Uma tentativa sandbox incerta, sem CHEC_id local | Resultado externo e resposta técnica do provedor ainda pendentes. Não reenviar |
| Webhook financeiro | Receptor sandbox e testes de autenticação/unicidade já registrados | Nenhuma notificação recebida na fotografia atual. Sem exemplo autêntico ou confirmação final do método aplicável ao produto |
| Repasse e reembolso | Flags reais bloqueadas; estudo de custódia e riscos registrado | Confirmar produto/conta, condições de custódia, liberação, saldo e tratamento após repasse antes de implementar operação real |
| Verificação documental | Plano de escopo privado salvo | Não implementada; não coletar documentos reais nem anunciar selo genérico |

## Conferência de segurança somente de leitura

Nesta revisão, nove tabelas públicas essenciais foram conferidas com RLS ativo: clientes, profissionais, solicitacoes, historico_solicitacoes, mensagens_solicitacoes, avaliacoes_servico, reclamacoes_servico, respostas_reclamacao e acompanhamento_reclamacoes. A tabela privada de leitura dos avisos tem RLS e nenhum SELECT/INSERT direto concedido a authenticated.

As cinco RPCs públicas novas de avisos/acompanhamento/listagem administrativa não concedem EXECUTE a anon. Estes metadados não substituem os testes de participação/revogação ou uma auditoria completa de produção; as evidências comportamentais estão nos testes e documentos das implementações.

Advisors mantêm nove INFO de tabelas privadas com RLS sem políticas, bloqueio intencional documentado, e o WARN anterior de proteção contra senhas vazadas desabilitada. Nenhum achado novo ou alteração de Auth/permissões nesta revisão. Avaliar a configuração de Auth antes de produção sem enfraquecer proteções para contornar avisos.

Referências dos avisos:
- https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Fotografia financeira local em 26/11/2026

| Contagem | Resultado |
| --- | ---: |
| Checkouts registrados | 1 |
| Checkouts incertos | 1 |
| Sem identificador externo registrado | 1 |
| Flags de cobrança real habilitadas | 0 |
| Flags de repasse habilitadas | 0 |
| Notificações recebidas no receptor sandbox | 0 |
| Eventos com processamento financeiro | 0 |

Esses números descrevem somente o banco de homologação. Não demonstram que o provedor rejeitou ou não criou o checkout. Preservar a preparação 88cecf6d-cf3b-4112-a8ca-9a33d767a58e e a referência tf-sandbox-89934739-87f9-4c53-b8ca-8b757dd81f53, sem novo POST, limpeza de claim ou reabertura automática.

## Pendências que realmente mudam a prontidão

1. **Resposta técnica PagBank e sandbox completo.** Proprietário informou envio de e-mail; não há resposta técnica/protocolo novo confirmado. O e-mail Mercado Pago/Fattor mostrado depois foi desconsiderado pelo proprietário e não altera esta pendência. Caso geral 75359297 não representa encaminhamento confirmado às Integrações. Não exigir ligação ou repetir formulários/e-mail automaticamente. Recuperar resultado da tentativa, identificar CHEC_id ou evidência de rejeição e confirmar assinatura/payload do produto antes de novo ensaio financeiro.
2. **Condições financeiras operacionais.** Confirmar taxas, produto contratado, divisão, custódia/reserva e liberação, reembolso/contestação, saldo insuficiente e responsabilidade após repasse. Registrar uma reclamação no aplicativo não garante que haverá dinheiro disponível. Não escolher prazos, ativar custódia ou repasse por mera continuação do desenvolvimento.
3. **Ensaio privado do fluxo atual.** Usar ROTEIRO-ENSAIO-PRIVADO-SEM-PAGAMENTOS.md. Selecionar contas e aparelho de teste, sem inventar e-mails nem pedir códigos de terceiros. Sem convites/ampliação da audiência nesta revisão. Resultados de novos participantes e aparelho físico continuam não confirmados.
4. **Preparação da operação pública.** Consolidar condições de uso/privacidade e atendimento, revisar configuração de Auth, evidências e pendências antes de propor produção. Se houver proposta de conferência documental, definir finalidade, dados mínimos, revisores e retenção antes de pedir arquivos reais. Não há prazo contratual ou jurídico escolhido automaticamente aqui.

## Resultado desta revisão

Ajuda e melhorias internas estão publicadas na prévia privada. A integração financeira externa ainda não está concluída, e nenhuma cobrança real está autorizada. Esta revisão atualiza o diagnóstico e o roteiro; não representa nova funcionalidade, nova execução dos 277 testes ou resolução do bloqueio externo. As verificações atuais foram consultadas; não houve alteração no app, banco, audiência ou transação financeira.
