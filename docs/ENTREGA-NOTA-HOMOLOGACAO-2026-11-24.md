# Declaração de entrega de nota — 24/11/2026

Implementação `abe628ed9379cd57656483a5c6f6e58468349f0c`, branch codex/v16-seguranca-integracoes.

## Comportamento
O prestador, depois de confirmar atendimento do pedido fiscal, pode informar que entregou a nota pelo canal combinado. As duas partes consultam o registro. O cliente não pode fazê-lo pelo profissional. Não há arquivo, campo livre, número de documento, emissão automática, verificação fiscal ou confirmação de recebimento.

## Segurança e recuperação
Tabela public.entregas_pedido_nota com FK para atendimento, titular obtido por auth.uid(), RLS restritiva para sessão não anônima e políticas de participantes. INSERT só de solicitacao_id para o profissional da contratação com atendimento prévio; SELECT somente às partes. Sem UPDATE/DELETE ou funções privilegiadas. Timestamp e autor não são fornecidos pelo navegador.
Chave primária por contratação impede duplicação; resposta incerta exige nova consulta, sem repetição automática. A interface valida autor, contratação e data, e ignora respostas de outra sessão.

## Evidências
- Suíte geral/interface: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45516284839 — success.
- Concorrência anterior: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45516284763 — success.
- Financeiros: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45516285253 — success.
- Prévia isolada: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45516284795 — success.
- Migração entrega_pedido_nota aplicada exclusivamente em asdszqtpydiowgerxwee.
- Teste integrado com identidades fictícias e ROLLBACK aprovado. Zero entregas e identidades QA persistidas; um profissional existente preservado; UPDATE/DELETE não concedidos.
- Advisors mantiveram nove INFO de tabelas privadas sem políticas por bloqueio intencional e WARN preexistente de proteção contra senhas vazadas. Referência: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Fonte da hospedagem `578e563f292e6ff539fd93bd087c695e41a49ab9`, mesmo site privado e proprietário, sem visitantes externos. Publicação deve ter status confirmado separadamente.

Nenhuma mudança em produção ou ativação financeira. Não repetir fluxo manual antigo para validar esta entrega.
