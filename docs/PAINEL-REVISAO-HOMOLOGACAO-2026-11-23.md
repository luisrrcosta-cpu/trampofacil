# Painel de revisão de profissionais — homologação
Data: 23/11/2026.
Implementação: entrada na página inicial, autenticação OTP normal, fila paginada de 50 perfis e aprovação explícita com confirmação.
O botão não é autorização: cada RPC exige revisor ativo no servidor. Conta comum recebe área reservada, sem perfis.

## Permissões propostas
Schema isolado revisao_admin, fora da exposição REST, com duas funções SECURITY DEFINER para o acesso estritamente administrativo.
Wrappers públicos SECURITY INVOKER, EXECUTE somente authenticated. Sem USAGE em private nem grants nas tabelas privadas.
Função de listagem confere auth.uid(), is_anonymous e lista privada ativa a cada chamada; a aprovação delega à rotina interna já testada com os mesmos controles.
search_path vazio em todas as funções. Sem user_metadata, e-mail fixo ou chave secreta no navegador.
A listagem entrega apenas UUID do perfil, data da solicitação e seis campos de apresentação; sem telefone, e-mail, CPF/CNPJ ou dados de clientes.
Aprovação exige versão exata, solicitação e conta revisora distinta do profissional; registra auditoria e preserva pausa/contratos/pagamentos.
Nenhum perfil é aprovado na migração.

## Recuperação
Resposta incerta de aprovação limpa a fila e exige nova consulta; não repete o POST automaticamente.
Troca de conta invalida respostas antigas e limpa os perfis carregados. Erros e revogação não mantêm ações baseadas em dados antigos.
Paginação usa 50 registros com sentinela; após aprovar, retorna à primeira página para evitar saltos por exclusão da fila.

## Testes
PGlite: comum, anônimo, revisor, revogação, autoaprovação, versão antiga, repetição, tabelas privadas sem acesso e preservação da pausa.
Browser com API simulada: negação, texto seguro, aprovação com resposta perdida, recuperação sem duplicação, sucesso e limpeza na troca de sessão.
Ainda não representa verificação documental ou habilitação profissional. Recusas e pedidos de ajuste ficam para etapa posterior.
Estado de aplicação/publicação deve ser confirmado no histórico da homologação e no relatório de entrega antes de orientar uso.

## Entrega confirmada
Migração painel_revisao_perfis aplicada somente em asdszqtpydiowgerxwee.
CI de implementação: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45270509364 (sucesso); finanças, concorrência e prévia isolada também passaram.
Teste no PostgreSQL remoto, em transação revertida e com claims simuladas: conta comum recusada, revisor consulta a fila e autoaprovação recusada.
Conferência após teste: zero aprovações, zero perfis pendentes, authenticated sem USAGE em private e sem UPDATE direto de publicado.
Advisors após migração: mesmos 7 INFO de tabelas privadas com negação padrão e aviso pré-existente de proteção de senha; nenhum novo achado.
Referências: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
Publicação privada concluída: appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_7c18be610aa88191b48b43c674145fd0.
Fonte hospedada: 3931b127c2fff4801800709eea144708ac4aea2f. Fonte do aplicativo: 3bf7cb6622ab05b4fdc95ad2382739dbe03a44d6.
O login HTTP real da conta revisora no painel ainda não foi observado; testes de interface utilizaram API simulada. Nenhum perfil foi aprovado para produzir evidência de teste.
