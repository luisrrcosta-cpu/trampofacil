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
A migração deve ser aplicada somente em asdszqtpydiowgerxwee após aprovação dos testes no GitHub.
A interface da branch deve ser publicada no site privado quando o ambiente de empacotamento estiver disponível. Não presumir que código no GitHub já está no site.
Produção e pagamentos reais fora do escopo.
