# Recuperação de conversa indisponível — 23/11/2026

Quando a API retornava uma lista vazia para a contratação, limparConversa apagava os dados e a seleção era removida antes do finally. A condição de liberação dos controles deixava de corresponder à operação original e a tela podia ficar bloqueada.

A correção conserva somente o identificador selecionado para permitir nova consulta e manter a liberação condicionada à mesma sessão e contratação. Dados da conversa, orçamento, título, rascunho e possibilidade de envio continuam limpos quando a contratação está indisponível.

Teste de navegador cobre: resultado vazio, botões ativos, nova consulta bem-sucedida, perda posterior de disponibilidade, limpeza de dados anteriores e retorno à lista.
Sem mudanças no banco, RLS, privilégios, pagamentos ou produção.

## Resultado confirmado
- 224 testes aprovados, zero falhas: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45205183072 . Verificações financeiras, concorrência e prévia isolada passaram.
- Publicação privada concluída: versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_786e13cce4308191bf42dfa2a43b5d0f; deployment appgdep_6b045b6245a08191b26d66b992469b16.
- Fonte da interface b7e4131259cc6015c59e2b19b4156781e0812e31; hospedagem 0419b0eabe0d0d3f07c55b976030e721d567c976. Acesso exclusivo do proprietário preservado.
