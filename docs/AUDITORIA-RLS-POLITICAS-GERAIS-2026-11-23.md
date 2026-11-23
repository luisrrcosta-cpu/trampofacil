# Auditoria RLS — retificação de 2026-11-23

**Resultado: alerta inicial de acesso amplo NÃO confirmado. Nenhuma alteração de política foi aplicada nesta revisão.**

## Evidência revisada
A primeira inspeção consultou `pg_policies` sem incluir a coluna `permissive`. Por isso, o relatório anterior interpretou incorretamente as políticas gerais como permissivas.

Nova consulta de leitura em Supabase **homologação** (`asdszqtpydiowgerxwee`) confirmou:
- `public.profissionais`: `profissionais_autenticacao`, comando `ALL`, **RESTRICTIVE**.
- `public.pedidos_nota_fiscal`: `nota_autenticacao`, comando `ALL`, **RESTRICTIVE**.
- As políticas específicas de titularidade/participantes são **PERMISSIVE**.

Em PostgreSQL, políticas `RESTRICTIVE` são combinadas com `AND` com as políticas permissivas aplicáveis, não com `OR`. Portanto, a hipótese de que as políticas gerais contornariam automaticamente as políticas específicas **não procede**.

## Pendências de validação
- Conferir `GRANT`s efetivos, inclusive herdados, e eventuais privilégios por coluna.
- Executar testes autenticados com dois usuários fictícios em SELECT/INSERT/UPDATE/DELETE e verificar separação entre titulares e participantes.
- Confirmar que funcionalidades de descoberta de prestadores não dependem de leitura indiscriminada de dados privados.
- Revisar Security Advisor, telas e APIs após mudanças do Work.

**Restrições:** produção intocada, RLS preservada, nenhum pagamento real habilitado.

## Histórico
Esta retificação substitui a avaliação de risco registrada inicialmente no mesmo documento. A interpretação original foi baseada em evidência incompleta.
