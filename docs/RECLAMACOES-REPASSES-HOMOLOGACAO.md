# Reclamações, repasse e reembolso — homologação

Atualizado em 26/11/2026. Esta é uma entrega de atendimento em testes; não é uma garantia de custódia ou de reembolso automático.

## Implementado

- Cliente registra um relato inicial por pedido, incluindo pedidos concluídos ou cancelados, sem prazo artificial que elimine direitos legais.
- Profissional participante consulta e registra uma resposta inicial.
- Registro e resposta são imutáveis para as partes. Referência é o UUID do pedido; a chave única impede duplicação após resposta perdida.
- Consulta administrativa somente pelos revisores ativos já autorizados; sem novos usuários administrativos. Administrador participante não consulta o próprio caso pela fila administrativa.
- Textos privados às partes e atendimento autorizado, de 10 a 2.000 caracteres. Sem anexos nesta entrega. Não inserir documentos, dados bancários ou senhas.
- Campos de autoria e horário são definidos no banco, não fornecidos pelo cliente. RLS e privilégios por coluna impedem falsificação, alteração, exclusão e leitura por terceiros/anônimos.
- Navegação e troca de sessão descartam respostas antigas. O código usa textContent e mantém CSP restritiva.

## Limites operacionais

A administração autorizada agora registra início de análise, respostas, conclusão do atendimento e reabertura, mantendo histórico imutável visível às partes. Conclusão é administrativa: não executa ressarcimento, não declara quitação financeira nem elimina direitos legais. O módulo ainda não atribui responsável, envia notificações ou define SLA. A conta administrativa precisa consultar a fila; as partes consultam o acompanhamento manualmente.

Não foram habilitados pagamentos reais, repasses, reembolsos, custódia, prazo de liberação ou promessa de reserva. A tentativa sandbox PagBank incerta permanece intocada. Nenhuma chamada financeira foi repetida.

## Risco que continua pendente antes do lançamento financeiro

Se o profissional já recebeu e não tem saldo disponível, registrar a reclamação não recupera o dinheiro. Será necessário confirmar com PagBank o produto contratado e definir, com revisão jurídica/contratual aplicável, custódia ou reserva, condições de repasse, análise de casos e tratamento de reclamações posteriores ao repasse. Não presumir que sete dias encerram a responsabilidade ou que toda reclamação exige devolução integral.

A documentação atual de Order/Split descreve custódia opcional por recebedor e liberação automática na data prevista; sem data, informa padrão de 90 dias, com limite de agendamento de 365 dias. Isso não confirma habilitação na conta nem compatibilidade com a integração Checkout deste projeto. Não adotamos esse prazo padrão. A documentação atual de cancelamento com split exige saldo de todos os recebedores envolvidos. Não aplicar a regra de fallback de documentos antigos de outro produto.

Fontes oficiais consultadas:
- https://developer.pagbank.com.br/reference/crie-e-pague-um-pedido-com-custodia
- https://developer.pagbank.com.br/reference/cancelamento-de-pedido-com-divisao-de-pagamento
- https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm (CDC, arts. 20, 24, 26 e 49)

Perguntas para confirmação escrita do provedor, sem envio automático: nossa conta pode usar Order Split com custódia? É compatível com o Checkout já iniciado ou requer outra integração? Como impedir liberação agendada quando existe disputa? Como estornar antes/depois da liberação e quando um recebedor não tem saldo? Quais prazos, tarifas, contratos e responsabilidades se aplicam?

## Validação

Migration criada com CLI Supabase: supabase/migrations/20261126214707_reclamacoes_servico_homologacao.sql. Aplicada somente em asdszqtpydiowgerxwee. Metadados confirmaram duas tabelas com RLS, seis políticas, autoria protegida e ausência de UPDATE/SELECT anônimo. Advisors sem novos achados; os avisos anteriores permanecem.

Testes isolados PostgreSQL/PGlite e navegador com API simulada cobrem titularidade, privacidade, perda de resposta, unicidade, resposta profissional, texto não executável e acesso administrativo revogado. A suíte de CI do commit d1f91ace8515ae0c368ea6bb58fe57e8921f11c1 passou 267 testes mais regressões. O empacotamento precisou acrescentar reclamacoes.js à lista exata de scripts; corrigido em 25ab0359d953e3687e5eec7ee995f9256281722b. Sem dados reais de reclamações criados nos testes.


## Acompanhamento — continuação em 26/11

Status inicial derivado: aguardando_analise. Transições: iniciar em_analise; acrescentar resposta ou concluir a partir de em_analise; reabrir concluida para em_analise. Sem exclusão/edição do histórico. Cada evento possui versão sequencial e UUID de operação; bloqueio de linha, versão esperada e idempotência evitam perda de alterações e duplicação. Revogação de revisor é conferida sob lock; administrador participante não decide o próprio caso. Consulta paginada por versão, 50 itens mais sentinela, sem expor autoria administrativa na resposta da RPC.

Migração: supabase/migrations/20261126220117_acompanhamento_reclamacoes_homologacao.sql, aplicada somente à homologação. Privilegios diretos de INSERT/UPDATE/DELETE revogados, duas políticas RLS, RPCs públicas invoker e internas definer com search_path vazio. Nenhum dado existente removido, nenhum evento real criado nos testes, nenhum efeito financeiro.

Testes PGlite: transições, reabertura, idempotência, revisão antiga, acesso de cliente/profissional/terceiro/anônimo, revogação, proteção contra decisão no próprio caso e paginação. Teste PostgreSQL com conexões independentes comprovou disputa de lock, mesmo UUID repetido, revisão concorrente e revogação. Teste de navegador usa origem HTTPS simulada para crypto.randomUUID, recupera resposta perdida por consulta, conclui atendimento, percorre 60 eventos em duas páginas, impede execução de HTML e descarta resposta após troca de sessão.


## Avisos internos de atendimento — 26/11

Área Meus avisos com respostas iniciais do profissional para o cliente e eventos administrativos para cliente/profissional participantes. Os avisos são derivados dos registros de atendimento existentes: não cria outro texto de reclamação, não altera status do caso e não envia e-mail, WhatsApp ou push. Novos pedidos e conversas ainda não fazem parte desta entrega. Consulta ao abrir a área e pelo botão Atualizar avisos; não há polling ou promessa de alerta em segundo plano.

Marcar como lido é individual por usuário/tipo/evento, com horário do servidor e chave única. Uma leitura não confirma resolução, aceitação de serviço, reembolso ou repasse. Em caso de resposta perdida, a interface consulta por atualização manual, sem repetir o envio automaticamente. A leitura de uma parte não marca a da outra. Terceiros e revisores que não participam do pedido não recebem os avisos das partes.

Paginação por cursor composto (horário original, tipo, UUID), 50 itens mais sentinela, preservando microssegundos no cursor. Resumo de não lidos refere-se somente aos avisos exibidos. Atalho Ver solicitação usa a navegação existente com foco no pedido quando disponível na lista. Conteúdo renderizado com textContent; sessão e versão da consulta descartam respostas antigas após saída/troca de conta. Nenhum documento ou informação bancária novo.

Migração: supabase/migrations/20261126222715_avisos_atendimento_homologacao.sql. Recibos na tabela private.leituras_avisos_atendimento com RLS e sem privilégios diretos para clientes/service_role; RPCs públicas invoker e internas definer com search_path vazio, conferindo destinatário pelo auth.uid(). Nenhum parâmetro permite informar outro usuário ou horário de leitura.


Validação: 271 testes aprovados no CI 45905274412; financeiro 45905274351, concorrência 45905274318 e prévia 45905274448 também success. Migration aplicada somente em asdszqtpydiowgerxwee; RLS, privilégios e funções conferidos após aplicação, advisors sem novos achados. Nenhum recibo real criado em testes; nenhum dado existente excluído e nenhum efeito financeiro. Código 45105ee26c01fc89cd9498bbd661e8c2c31de463.
