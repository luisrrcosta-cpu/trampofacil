# Múltiplas especialidades — plano de implementação em homologação

Estado: proposta técnica, não aplicada ao banco. Preservar produção e pagamentos.

## Modelo
Manter profissionais.servico como profissão principal (compatibilidade com registros, solicitações e revisão existentes). Propor até 10 especialidades adicionais, cada uma com 2–120 caracteres, sem duplicatas após normalização. Não concatenar serviços no campo legado nem usar descrição como fonte de autorização. Armazenar especialidades em estrutura própria vinculada ao profissional; separar rascunho e publicação. Não conceder escrita pública. Definir esquema final após inspecionar chaves, políticas, triggers e funções reais da homologação.

## Fluxos
- Cadastro e Meu cadastro: adicionar/remover especialidades, sugestões do catálogo e texto livre; salvar atomicamente com o perfil.
- Revisão administrativa: incluir lista integral no snapshot esperado, aprovação e recusa; alterações posteriores invalidam aprovação conforme regras atuais. Impedir corrida entre edição e aprovação.
- Catálogo: publicar somente especialidades aprovadas de perfis ativos, respeitando pausa e recusa. Busca por profissão principal ou especialidade, sem duplicar profissional, mantendo paginação de 20 e filtro de cidade. Não ampliar retorno de dados privados.
- Solicitação: identificar especialidade escolhida no escopo acordado, sem alterar contratos ou pedidos históricos.
- Atividades regulamentadas: não publicar sem requisitos aplicáveis e verificação adequada.

## Critérios de aceitação
1. Cadastro legado sem especialidades permanece funcional.
2. Profissional com Pedreiro e Pintor aparece em ambas as buscas após aprovação.
3. Especialidade pendente, recusada ou de perfil pausado não aparece.
4. Anônimo não escreve; usuário A não modifica especialidades de B.
5. Limites, duplicatas, espaços, acentos, caracteres de controle e entradas inválidas são testados no servidor.
6. Aprovação concorrente com edição não publica conteúdo não revisado.
7. Busca sem termo não duplica perfis; paginação, cidade e limites existentes continuam válidos.
8. Nenhum CPF, telefone ou documento adicional no catálogo público.
9. Testes de navegador de cadastro, edição, revisão e busca, mais testes de isolamento RLS e concorrência.
10. Nenhuma mudança em produção ou pagamento real.

## Ordem
Inspecionar esquema real e dependências; preparar alteração aditiva e testes isolados; validar segurança; aplicar apenas em homologação; integrar interface e revisão; executar regressão e documentar resultados. Não anunciar recurso como disponível antes da validação.
