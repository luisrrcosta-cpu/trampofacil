# Atendimento do pedido de nota — homologação, 23/11/2026

O profissional participante pode confirmar que está cuidando de um pedido de nota existente. O cliente e o profissional podem consultar a confirmação. Isso não comprova emissão, entrega de documento, pagamento ou obrigação fiscal.

## Segurança
Tabela atendimentos_pedido_nota: um registro por pedido, profissional derivado de auth.uid(), data do banco. RLS limita leitura aos participantes e gravação ao profissional da contratação; sessão anônima e terceiros bloqueados. INSERT só aceita solicitacao_id. Sem UPDATE/DELETE, campos livres, arquivos ou status de emissão. Nenhuma mudança nas permissões do pedido original ou em dados financeiros.

## Interface e testes
A confirmação é explícita, sem envio automático. Resposta perdida pede nova consulta; chave única impede duplicatas. Retornos com autoria divergente são recusados e respostas de sessão antiga descartadas.
Testes de banco cobrem titularidade, unicidade, campos protegidos e acesso das duas partes; navegador cobre resposta perdida e acompanhamento pelo cliente.

Migração atendimento_pedido_nota exclusiva de asdszqtpydiowgerxwee, a aplicar após testes. Não cria pedidos em nome de usuários nem emite notas.
