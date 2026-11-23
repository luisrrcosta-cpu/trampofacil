# Auditoria de privilégios por coluna — homologação — 2026-11-23

**Resultado revisado: permissões específicas de coluna confirmadas; não é correto concluir que cadastro e pedido de nota estão bloqueados com base apenas em `has_table_privilege`.**

## Verificações executadas (somente leitura)

Projeto: `asdszqtpydiowgerxwee`.

- `has_table_privilege('authenticated', ..., 'INSERT'/'UPDATE')` retorna `false` para as tabelas analisadas; isto **não** cobre privilégios por coluna.
- `has_column_privilege('authenticated', ..., coluna, 'INSERT'/'UPDATE')` mostra:
  - `public.profissionais`: INSERT e UPDATE permitidos para `usuario_id`, `nome`, `cidade`, `servico`, `descricao`, `telefone`, `tipo_prestador`, `tipo_atividade`.
  - `public.profissionais`: INSERT/UPDATE **negados** para `id`, `criado_em`, `publicado`.
  - `public.pedidos_nota_fiscal`: INSERT permitido **apenas** em `solicitacao_id`; SELECT permitido nas quatro colunas; UPDATE negado em todas.
- RLS está habilitado nas duas tabelas, com políticas de autenticação `RESTRICTIVE` e políticas específicas `PERMISSIVE`.

## Interpretação

Esses privilégios são compatíveis com a gravação direta de campos autorizados via Data API, mantendo a publicação sob controle e o estado de nota imutável para o usuário. As políticas RLS ainda precisam autorizar a linha em cada operação.

**Não foi realizado teste autenticado de ponta a ponta com duas contas distintas.** A análise de privilégios, isoladamente, não prova que todos os fluxos de interface funcionam.

## Próximos passos

1. Testar cadastro/edição com um usuário de homologação, incluindo rejeição de `publicado` e tentativa de trocar titularidade.
2. Testar pedido de nota com cliente participante e usuário não participante, incluindo duplicidade.
3. Validar interface publicada, autenticação e mensagens de erro.
4. Verificar Security Advisor após alterações futuras.

## Histórico da retificação

O relatório inicial alertava para falta de GRANTs de tabela. A investigação subsequente identificou GRANTs **por coluna** que justificam a ausência dos GRANTs amplos. Não conceder privilégios gerais como correção automática.

**Nenhuma alteração no banco ou produção foi feita nesta revisão. Pagamentos reais seguem fora do escopo.**
