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
A interface desta etapa foi publicada no site privado em 23/11/2026, preservando acesso exclusivo do proprietário.
Produção e pagamentos reais fora do escopo.

## Evidência e retomada
- Implementação: d2566aea4b738756ac7e165c262d715b9223bef0.
- 216 testes, zero falhas: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45180484117 . Demais verificações financeiras, concorrência e prévia isolada passaram.
- Auditoria de segurança sem novos achados. Permanecem apenas os apontamentos anteriores, documentados em docs/VALIDACAO-CADASTROS-HOMOLOGACAO-2026-11-23.md.
- O ambiente voltou e a publicação foi concluída. O site privado agora contém a tela de pedido de nota.
- Publicação confirmada: versão salva appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_b456ec3803cc8191a3fbf34d6a886597; deployment appgdep_6b0441a7ad60819197de767988dfb40e, status succeeded. Fonte de interface: 5278bac; commit de hospedagem 6a6ae17123de4b51feb1f7e55b23e0d102606713. URL: https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site . Não reaplicar a migração.
