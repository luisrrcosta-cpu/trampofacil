# Atendimento do pedido de nota — homologação, 23/11/2026

O profissional participante pode confirmar que está cuidando de um pedido de nota existente. O cliente e o profissional podem consultar a confirmação. Isso não comprova emissão, entrega de documento, pagamento ou obrigação fiscal.

## Segurança
Tabela atendimentos_pedido_nota: um registro por pedido, profissional derivado de auth.uid(), data do banco. RLS limita leitura aos participantes e gravação ao profissional da contratação; sessão anônima e terceiros bloqueados. INSERT só aceita solicitacao_id. Sem UPDATE/DELETE, campos livres, arquivos ou status de emissão. Nenhuma mudança nas permissões do pedido original ou em dados financeiros.

## Interface e testes
A confirmação é explícita, sem envio automático. Resposta perdida pede nova consulta; chave única impede duplicatas. Retornos com autoria divergente são recusados e respostas de sessão antiga descartadas.
Testes de banco cobrem titularidade, unicidade, campos protegidos e acesso das duas partes; navegador cobre resposta perdida e acompanhamento pelo cliente.

Migração atendimento_pedido_nota aplicada somente em asdszqtpydiowgerxwee após os testes. Não cria pedidos em nome de usuários nem emite notas.

## Resultado confirmado
- 231 testes aprovados, zero falhas: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45235814904 . Financeiros, concorrência e prévia isolada aprovados.
- Teste integrado no PostgreSQL real com roles/claims simuladas e rollback: cliente impedido de confirmar pelo profissional, profissional registra, cliente consulta, terceiro bloqueado, duplicidade bloqueada. Zero identidades QA e atendimentos fictícios persistidos.
- RLS ativa; anon sem leitura; authenticated sem inserir autoria ou alterar/apagar registros. Auditoria sem novos apontamentos; alertas anteriores permanecem documentados na retomada.
- Publicação privada concluída: versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_e7fe10152300819185f79fb04764fb76; deployment appgdep_6b0482842ad88191aaa93ababa33c496.
- Fonte 527cfab8dd10456bfa71955ed862349577f864ad; hospedagem d9adf2b3bbdd82e02fcaecd53573e9e20a7f311b. Acesso exclusivo do proprietário preservado.
