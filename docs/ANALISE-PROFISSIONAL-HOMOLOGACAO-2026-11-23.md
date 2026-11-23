# Pedido de análise profissional — 23/11/2026

## Comportamento
Meu cadastro > Profissional permite consultar o pedido de análise e solicitar a análise do perfil completo já salvo. São aceitos CPF, MEI e empresa, em atividade regular ou ocasional. O botão não publica nem verifica documentos.

A administração continua responsável pela análise por acesso administrativo autorizado. Não foi criado painel administrativo nem permissão de autoaprovação nesta etapa. A fila referencia o perfil atual, não uma versão congelada; a administração deve conferir os dados atuais antes de publicar. Se o perfil já estiver publicado, prevalece a visibilidade de profissionais e a tela oculta o novo pedido.

## Proteções
- Tabela solicitacoes_analise_profissional com RLS, titularidade e bloqueio de sessões anônimas.
- Um pedido por usuário profissional, situação fixa aguardando_analise, data do banco.
- Sem campos livres ou documentos, sem UPDATE/DELETE e sem SECURITY DEFINER.
- Somente perfis próprios, não publicados, com tipo_prestador e tipo_atividade salvos, podem pedir análise.
- Nenhuma alteração em profissionais.publicado, catálogo, produção ou pagamentos.
- Após resposta incerta, consultar novamente; chave primária impede duplicação.
- Troca de sessão ou de perfil invalida respostas atrasadas.

## Implantação e testes
Migração solicitar_analise_profissional aplicada somente em asdszqtpydiowgerxwee após aprovação dos testes. Conferência real: RLS ativa, anon sem leitura, authenticated sem aprovação ou autopublicação; zero pedidos criados pela implantação.
Testes de banco cobrem as seis modalidades, terceiros, perfis publicados/incompletos, duplicidade e impossibilidade de publicar. Teste de interface cobre completar e salvar antes da análise, envio incerto e troca de sessão.

## Resultado confirmado
- 219 testes aprovados, zero falhas: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45188862477 . Verificações financeiras, concorrência e prévia isolada também passaram.
- Publicação privada concluída: versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_cef0c39a1fa88191bc0e003e59935660; deployment appgdep_6b04466cdc248191ac148ae3d6778d9a.
- Fonte da interface: 7aa143d080e304ec1e5cc8a762576cd928810d46; hospedagem 6745a953e4c2ebc8c0db6af2db804ce35c133f89.
- URL: https://trampofacil-homologacao-luis.artfulazure32.chatgpt.site . Acesso exclusivo do proprietário preservado.
- Auditoria de segurança sem novos apontamentos; alertas anteriores e referências permanecem em docs/VALIDACAO-CADASTROS-HOMOLOGACAO-2026-11-23.md.
