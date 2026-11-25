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
