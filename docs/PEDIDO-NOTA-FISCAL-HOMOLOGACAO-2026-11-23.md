# Pedido de nota fiscal — primeira etapa, 23/11/2026

## Escopo
O cliente pode registrar um pedido de nota ao prestador para contratações aceitas, em andamento, entregues ou concluídas. O registro é consultável somente pelos participantes autenticados da contratação. Não há emissão, anexos, coleta de CPF/CNPJ ou campos livres fiscais.

A ausência de linha significa não solicitada; a única situação gravável é solicitada. Não existe opção de marcar emitida sem integração e comprovação. A entrega, a indisponibilidade e a emissão fiscal serão etapas separadas.

## Implementação
- public.pedidos_nota_fiscal: chave única por contratação, autoria derivada de auth.uid(), data gerada pelo banco e situação fixa.
- RLS: cliente registra apenas no próprio pedido elegível; profissional só consulta; terceiros e sessões anônimas não têm acesso.
- Não há UPDATE, DELETE, SECURITY DEFINER, privilégios de emissão ou operações de pagamento.
- Tela preparada em servicos.js: consultar pedido e, se ainda não houver, pedir nota ao profissional.
- Em envio com resposta perdida, a tela pede nova consulta; a chave primária impede duplicatas.
- Respostas atrasadas são descartadas após mudança de sessão ou da lista.

## Verificação e implantação
Os testes cobrem autorização, imutabilidade, duplicidade, estados de contratação, nenhum efeito financeiro, envio incerto e troca de sessão.
Migração pedidos_nota_fiscal aplicada somente em asdszqtpydiowgerxwee após os 216 testes passarem no GitHub. Conferência real: RLS ativa, três políticas, zero registros criados, anônimo sem leitura, titularidade gerada pelo banco, INSERT somente solicitacao_id, nenhum UPDATE/DELETE para authenticated.
A interface da branch deve ser publicada no site privado quando o ambiente de empacotamento estiver disponível. Não presumir que código no GitHub já está no site.
Produção e pagamentos reais fora do escopo.

## Evidência e retomada
- Implementação: d2566aea4b738756ac7e165c262d715b9223bef0.
- 216 testes, zero falhas: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45180484117 . Demais verificações financeiras, concorrência e prévia isolada passaram.
- Auditoria de segurança sem novos achados. Permanecem apenas os apontamentos anteriores, documentados em docs/VALIDACAO-CADASTROS-HOMOLOGACAO-2026-11-23.md.
- Ambiente local indisponível nesta etapa. O site privado continua na versão 9, com cadastros e validações; NÃO contém ainda a tela de pedido de nota.
- Retomada: abrir o site existente appgprj_6afeee187e488191b1c58ef23f6f0a98 pelo helper, preparar os 17 arquivos de interface do commit d2566ae ou descendente, preservar audiência exclusiva do proprietário e publicar somente em homologação. Não recriar site nem aplicar a migração novamente.
