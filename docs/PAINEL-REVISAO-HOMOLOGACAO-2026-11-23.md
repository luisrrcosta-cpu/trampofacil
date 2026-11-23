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
