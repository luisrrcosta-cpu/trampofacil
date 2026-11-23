# Auditoria de GRANTs efetivos — homologação — 2026-11-23

Consulta read-only via `has_table_privilege` no projeto `asdszqtpydiowgerxwee`.

| Tabela | RLS | authenticated SELECT | INSERT | UPDATE | DELETE | anon SELECT |
|---|---|---|---|---|---|---|
| `public.profissionais` | ligado | sim | não | não | não | não |
| `public.pedidos_nota_fiscal` | ligado | não | não | não | não | não |

As políticas de RLS de titularidade/participação existem, mas **RLS não substitui privilégios SQL**. O acesso direto via Data API com papel `authenticated` pode falhar para operações sem GRANT, mesmo que a política RLS permita. Pode haver APIs/funções de backend responsáveis pela gravação; confirmar arquitetura antes de modificar privilégios.

## Próximos testes
1. Inspecionar como as telas de cadastro e pedido de nota fazem as chamadas (Data API direta, RPC, Edge ou backend).
2. Testar com duas contas fictícias, sem dados reais, operações autorizadas e tentativas cruzadas.
3. Caso a aplicação precise de gravação direta, conceder **somente** privilégios mínimos por operação e manter RLS de titularidade. Se usa backend privilegiado, não conceder acesso desnecessário.
4. Verificar se campos privados estão separados do perfil público e se dados legados continuam acessíveis apenas ao titular.
5. Executar Security Advisor e regressões após qualquer ajuste.

**Nenhuma alteração foi aplicada ao banco nesta auditoria.** Não modificar produção nem ativar pagamentos reais.
