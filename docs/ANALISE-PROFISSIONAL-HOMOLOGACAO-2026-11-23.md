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
Migração aditiva exclusiva de asdszqtpydiowgerxwee, a aplicar após os testes.
Testes de banco cobrem as seis modalidades, terceiros, perfis publicados/incompletos, duplicidade e impossibilidade de publicar. Teste de interface cobre completar e salvar antes da análise, envio incerto e troca de sessão.
