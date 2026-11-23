# Auditoria de segurança — políticas RLS amplas (2026-11-23)

**Prioridade: alta. Estado: achado confirmado por consulta de leitura em homologação; correção NÃO aplicada.**

## Achados

1. `public.profissionais`: política `profissionais_autenticacao`, `FOR ALL TO authenticated`, com `USING` e `WITH CHECK` verificando apenas `auth.jwt()->>'is_anonymous' != 'true'`. Por políticas RLS permissivas combinadas com OR, essa regra pode tornar ineficazes as políticas de titularidade existentes (`auth.uid() = usuario_id`) para SELECT/INSERT/UPDATE/DELETE. O usuário autenticado não anônimo poderia alcançar registros de terceiros conforme os privilégios SQL disponíveis.
2. `public.pedidos_nota_fiscal`: política `nota_autenticacao`, `FOR ALL TO authenticated`, verifica apenas usuário autenticado e não anônimo. Pode contornar as políticas `nota_cliente_solicita` (INSERT do cliente participante) e `nota_participantes_leitura` (SELECT dos participantes).

## Evidência

Consulta em `pg_policies` do projeto Supabase de **homologação** `asdszqtpydiowgerxwee`, em 2026-11-23. A existência e expressões dessas políticas foram verificadas; **não** foi feito teste de exploração com contas distintas. Risco de acesso efetivo depende também de GRANTs e outras camadas.

## Correção recomendada

- Antes de aplicar, inventariar privilégios de tabela/coluna, dependências de telas e as políticas completas.
- Substituir as políticas gerais permissivas por uma proteção que NÃO aumente o acesso além das políticas de titularidade/participação. Uma opção é uma política `AS RESTRICTIVE` de autenticação não anônima combinada com políticas permissivas de propriedade, após avaliar impacto de INSERT/SELECT/UPDATE/DELETE.
- Para `profissionais`, garantir SELECT do titular (e acesso público apenas por interface/view especificamente segura, caso necessário), INSERT do próprio usuário, UPDATE próprio com `USING` e `WITH CHECK`, DELETE negado salvo necessidade justificada.
- Para `pedidos_nota_fiscal`, garantir INSERT apenas pelo cliente participante e SELECT apenas pelas partes; UPDATE/DELETE negados por padrão até definir fluxo controlado de emissão.
- Testar usuário A versus B em todas as operações, inclusive tentativa de alterar `usuario_id`/`solicitacao_id`; confirmar ausência de acesso indevido e preservar fluxos legítimos.
- Verificar avisos do Security Advisor e guardar resultado dos testes.

## Restrições

Não alterar produção, não apagar dados, não desabilitar RLS, não ativar pagamentos reais. Evitar alteração concorrente com o Work; coordenar a correção antes de aplicar.
