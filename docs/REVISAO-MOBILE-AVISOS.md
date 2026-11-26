# Retorno de avisos e revisão em telas móveis

Entrega em 26/11/2026, apenas na homologação.

O atalho Ver solicitação procurava o pedido somente na primeira página (50 itens) e ignorava cartões ocultos por filtros. Agora o atalho dos avisos habilita uma busca pontual autenticada por ID quando necessário. A resposta precisa conter no máximo um pedido, com o mesmo identificador, dados válidos e participação da conta atual. Pedido ausente, resposta divergente, participante estranho e sessão expirada não liberam o cartão.

Se filtros esconderem o alvo, busca/situação/direção são limpas para mostrá-lo, com aviso explícito. A ordem selecionada é preservada. O cartão recebe destaque laranja e foco no título, sem rolagem horizontal nos tamanhos testados. O foco respeita conta, versão da consulta e página ainda aberta. Mudanças de sessão descartam a resposta antiga.

A consulta pontual não substitui o cursor da primeira página. A continuação da lista deduplica o cartão incluído pelo atalho. O botão Voltar às solicitações da conversa conserva o comportamento anterior; a busca extra é opt-in somente no atalho dos avisos. A verificação comum de dados da lista e da busca pontual foi extraída para uma única função, com regressões comportamentais em vez de depender do texto exato da implementação.

Testes no navegador com API simulada, em 320, 360, 390 e 768 pixels: abrir aviso de pedido fora dos primeiros 50, filtros que ocultavam o alvo, foco/destaque, títulos e descrições longos, ausência de transbordamento horizontal e paginação sem duplicar. Testes negativos: consulta retorna pedido de outra conta, ID divergente, ausência, 401, pedido já na primeira página, ID inválido e troca de sessão durante resposta pendente. Nenhuma escrita na API das solicitações. Não é teste em aparelho físico nem validação de pagamentos reais.

Sem migração, alteração no banco, autenticação, audiência, cobrança, repasse ou reembolso. CSS/CSP atualizados por hash, mantendo políticas restritas e paleta aprovada.


A ordenação do pedido localizado é integrada por horário com precisão de microssegundos e desempate por UUID, preservando a ordem selecionada e o cursor de paginação. Títulos longos do resumo de reclamações também quebram linha; o contorno de foco fica contido no cartão. Regressões de validação executam entradas válidas/inválidas na função compartilhada, sem enfraquecer a participação obrigatória.

Validação final: código 955015592e6a84a68ffec05923077fad749b10e6. CI geral/interface 45910877371 passou 277 testes e regressões; financeiro 45910877376, concorrência 45910877381 e prévia 45910877401 success. git diff --check aprovado. Publicação permanece privada e limitada à homologação.
