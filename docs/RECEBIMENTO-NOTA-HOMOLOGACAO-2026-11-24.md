# Recebimento de documento pelo cliente — 24/11/2026

Implementação: `9455e39495fced798be5acb9b03692e7555f613a`.

Cliente confirma recebimento pelo canal combinado apenas após declaração de entrega. O profissional consulta, mas não confirma pelo cliente. A ausência de confirmação não significa que não houve entrega. Não há validação fiscal, emissão automática, anexo, campo livre ou alteração de contrato/pagamento.

## Proteções
public.recebimentos_pedido_nota: FK para entrega, cliente e timestamp definidos no servidor, RLS com autenticação não anônima e participação na contratação. Somente INSERT(solicitacao_id) pelo cliente e SELECT pelas partes; sem UPDATE/DELETE, service_role ou SECURITY DEFINER. Chave primária impede duplicação.
Interface exige confirmação expressa, valida autor/ID/data e mantém os controles ocultos em respostas inválidas. Resposta incerta exige consulta, sem escrita automática. Teste de navegador cobre perda de resposta, consulta por ambas as contas, bloqueio do botão profissional e resposta com autor incorreto.

## Validação
- Geral/interface: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45517084489 — success.
- Concorrência: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45517084497 — success.
- Financeiros: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45517084545 — success.
- Prévia: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45517084569 — success.
- Migração recebimento_pedido_nota aplicada exclusivamente em asdszqtpydiowgerxwee.
- Fluxo integrado com identidades fictícias e ROLLBACK passou. Zero recebimentos e identidades QA persistidos; RLS=true, UPDATE/DELETE=false.
- Advisors sem mudança: nove INFO de tabelas privadas sem políticas (negação intencional) e um WARN preexistente de proteção de senhas vazadas: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .
- Fonte hospedada preparada: `4709350a24437b8cb0fcfb4ff55aecc4e01a2a37`. Mesmo projeto e acesso somente ao proprietário. Consultar o status da nova publicação antes de afirmar que está disponível.

Produção e pagamentos reais permanecem fora do escopo. Não repetir o fluxo manual anterior no celular sem alteração relevante.
