# Verificação de constraints de cadastro — homologação — 2026-11-23

## Código conferido
`cadastro.js` usa `POST /rest/v1/{clientes|profissionais}?on_conflict=usuario_id` com `Prefer: resolution=merge-duplicates,return=minimal` após confirmar OTP. O comportamento pretendido é inserir ou atualizar o cadastro do usuário autenticado.

## Banco conferido (somente leitura)
No projeto `asdszqtpydiowgerxwee`, consultas a `pg_constraint` confirmaram:
- `clientes_usuario_id_key`: `UNIQUE(usuario_id)`.
- `profissionais_usuario_id_key`: `UNIQUE(usuario_id)`.
- `profissionais_tipo_prestador_check`: valores permitidos `pessoa_fisica`, `mei`, `empresa`.
- `profissionais_tipo_atividade_check`: valores permitidos `regular`, `ocasional`.
- Restrições de conteúdo para nome, cidade, telefone, serviço e descrição.
- `pedidos_nota_fiscal_pkey`: uma linha por `solicitacao_id`.
- `pedidos_nota_fiscal_estado_check`: estado exclusivamente `solicitada`.

## Interpretação
A chave única é compatível com o parâmetro `on_conflict=usuario_id` usado pelo cadastro. As constraints reforçam a validação do navegador. A presença dessas regras não substitui testes HTTP de INSERT e UPSERT autenticados com usuários reais de homologação.

## Próximos testes
- Criar usuário fictício de teste pelo fluxo normal, confirmar OTP, inserir perfil e repetir o cadastro (UPSERT).
- Confirmar que a tentativa de atualizar o perfil de outro usuário falha.
- Confirmar tratamento de erros de constraint e que `publicado` permanece fora do payload do usuário.
- Validar fluxo de pedido de nota e proteção contra duplicidade.

Nenhuma alteração em dados, permissões, produção ou pagamentos.
