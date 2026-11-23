# Recuperação de conversa indisponível — 23/11/2026

Quando a API retornava uma lista vazia para a contratação, limparConversa apagava os dados e a seleção era removida antes do finally. A condição de liberação dos controles deixava de corresponder à operação original e a tela podia ficar bloqueada.

A correção conserva somente o identificador selecionado para permitir nova consulta e manter a liberação condicionada à mesma sessão e contratação. Dados da conversa, orçamento, título, rascunho e possibilidade de envio continuam limpos quando a contratação está indisponível.

Teste de navegador cobre: resultado vazio, botões ativos, nova consulta bem-sucedida, perda posterior de disponibilidade, limpeza de dados anteriores e retorno à lista.
Sem mudanças no banco, RLS, privilégios, pagamentos ou produção.
