# Prontidão para lançamento — revisão de 27/11/2026

## Base verificada
Repositório luisrrcosta-cpu/trampofacil, branch codex/v16-seguranca-integracoes. Banco conferido somente em TrampoFacil-Homologacao (asdszqtpydiowgerxwee). Sem alteração de main, produção, registros de usuários, audiência ou dinheiro.

Últimos commits recuperados incluem catálogo ampliado, atalhos e busca por problemas cotidianos; três documentos de minutas/arquitetura de contratos e preparação privada de especialidades. Preparação não equivale a funcionalidade instalada.

A CI de 6acbfc3 falhou porque tests/catalogo-ampliado.test.js usava require e __dirname em projeto ES modules. Corrigido em d508ae74a9fd2a04981d9796f519507eb3313dd5. Os três casos passaram localmente. CI desse commit: geral/interface 46008039340, financeiro 46008039223 e concorrência PostgreSQL 46008039183, todos success. A execução geral anterior tinha 277 casos passando e um arquivo falhando; o número antigo de 231 testes não representa a suíte atual.

Identidade oficial aplicada no código b9efc5eb2a476e2c1479d32ca4617794b8d54978: arte extraída do PDF aprovado, pixels preservados em WebP sem perda, slogan, Instagram e região inicial. Ver IDENTIDADE-OFICIAL-2026-11-27.md. Resultado final de testes/publicação desta alteração deve constar no resumo atual.

## Estimativa por escopo
Indicador de planejamento, não medição automática nem autorização de lançamento. Percentuais estimam requisitos entregues e validados para um primeiro lançamento regional com pagamentos. Recursos visuais não compensam bloqueios financeiros.

| Área | Peso | Conclusão estimada | Evidência e lacuna |
| --- | ---: | ---: | --- |
| Cadastro, catálogo e contratação | 25% | 85% | Pedido, orçamento, etapas, mensagens, revisão administrativa, reclamações e avisos; falta ensaio integrado com usuários/aparelhos |
| Financeiro ponta a ponta | 25% | 30% | Preparação, receptor e proteções internas; falta checkout externo confirmado, evento autêntico, conciliação, repasse, estorno e reserva operacional |
| Contratos e aceites eletrônicos | 15% | 25% | Minutas e arquitetura documentadas; sem versão contratual persistida, assinatura/aceites de ambas as partes, PDF e bloqueio de início |
| Segurança e privacidade | 15% | 75% | RLS e testes de isolamento existentes; revisão final de Auth, retenção, documentos/habilitações e operação pública pendentes |
| Categorias e múltiplas especialidades | 10% | 55% | Catálogo ampliado e atalhos presentes; múltiplas especialidades ainda sem cadastro/revisão/publicação/busca integrada |
| Identidade e informações da empresa | 5% | 85% | Logo oficial, slogan, Instagram e região no código; validação/publicação privada e informações legais da operadora ainda necessárias |
| Ensaio de lançamento e operação | 5% | 40% | CI e roteiros; falta ensaio regional completo, procedimento de suporte, recuperação operacional e critérios de liberação |

Soma ponderada: 55,5%, comunicar aproximadamente 55%, faixa de incerteza 45–65%. O núcleo de contratação isolado está em cerca de 85%; isso não significa 85% do lançamento com dinheiro real. Reavaliar por evidências de cada entrega, não por número de commits/testes.

## Esforço restante e calendário
Estimativa inicial de 15–30 dias úteis de trabalho técnico focado, equivalente a aproximadamente 3–6 semanas, após requisitos financeiros e de operação ficarem esclarecidos. Não é compromisso de prazo, contagem em segundo plano ou garantia de execução contínua fora da conversa.

- Especialidades completas, revisão e concorrência: 3–5 dias de esforço.
- Contratos versionados, escopo/materiais/prazos, aceites auditáveis e interface: 4–7 dias.
- Integração financeira restante e ensaios, após definição do produto/conta: 5–10 dias.
- Segurança final, correções do ensaio, operação e validação móvel: 3–5 dias.
- Margem de integração e imprevistos incluída no teto de 30 dias; não somar todas as margens duas vezes.

Tempo do PagBank e confirmação de condições não estimáveis com as evidências atuais; podem ampliar o calendário. Não marcar data comercial antes de cumprir os bloqueios abaixo. A programação pode avançar nas especialidades/contratos sem exigir ligação do proprietário.

## Bloqueios de lançamento
1. Resolver a tentativa sandbox incerta sem novo POST: obter CHEC_id ou evidência de rejeição; confirmar produto e método de autenticação do webhook.
2. Definir e testar taxas, split/custódia/reserva, critérios de liberação, repasses, reembolso/contestação e saldo insuficiente após repasse. Registro de reclamação não segura dinheiro.
3. Implementar contratos e aceites com versão, snapshot, hash, ator autenticado, data servidor, idempotência e proteção contra edição/início concorrentes. Aceite do orçamento atual não é assinatura contratual.
4. Consolidar escopo, materiais, prazos, condições, termos, privacidade, dados da operadora e atendimento; minutas não estão vigentes no aplicativo.
5. Completar múltiplas especialidades em cadastro, revisão administrativa e catálogo sem publicar rascunhos ou dados privados.
6. Validar requisitos de profissões regulamentadas antes de anunciar verificação/habilitação. Não há selo de identidade verificada.
7. Executar ensaio ponta a ponta regional em aparelho físico, isolamento entre contas, recuperação de sessão/rede e rotinas operacionais, além da CI.
8. Revisar Auth/privacidade e somente então propor uma ativação de produção específica. Pagamentos reais permanecem proibidos pela autorização atual.

## Fotografia de segurança e financeiro em 27/11
Todas as 26 tabelas encontradas em public/private mantêm RLS ativa. Isso é uma inspeção de metadados, não auditoria integral nem prova de políticas corretas. Advisors: nove INFO em tabelas privadas intencionalmente bloqueadas, um WARN preexistente de proteção contra senhas vazadas. Não reduzir RLS para remover avisos.

- [Explicação de RLS sem política](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- [Proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Banco local de homologação: um checkout, incerto, sem identificador externo; zero flags de pagamento/repasse real, zero notificações e zero eventos financeiros processados. Não comprova rejeição no provedor. Preservar preparação 88cecf6d-cf3b-4112-a8ca-9a33d767a58e e referência tf-sandbox-89934739-87f9-4c53-b8ca-8b757dd81f53.

Não há tabela de especialidades aplicada na fotografia atual. SQL especialidades_preparacao.sql é proposta isolada, não migração aplicada. Contratos e aceites também continuam proposta, conforme ARQUITETURA-CONTRATOS-HOMOLOGACAO.md.

## Continuidade
Próxima frente técnica: integrar múltiplas especialidades ao fluxo de aprovação por versão, com testes isolados antes de DDL; em seguida contratos versionados e aceites. Não reaplicar cadastro, recusa, avisos ou reclamações já concluídos. Não enviar mensagens a terceiros, não repetir o checkout nem solicitar ligação como condição para continuar desenvolvimento.

Histórico e limites detalhados preservados em STATUS-ATUAL-TRAMPOFACIL.md, documentos das entregas, roteiro de ensaio privado e minutas. Esta avaliação não declara o aplicativo pronto para cobrança.

## Resultado da identidade e publicação desta retomada

Código b9efc5eb2a476e2c1479d32ca4617794b8d54978: geral/interface 46008614206, financeiro 46008614308, concorrência PostgreSQL 46008614311 e prévia 46008614251, todos success. Pacote com 21 arquivos comparados aos blobs da branch testada; arte validada sem perda e CSP íntegra. Fonte privada 67e6832f01cc2f9c35bec6a8fb5081ed231abecf; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_d94bd45705cc8191b14afd67205055bc; publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_385a70aca6588191b6472a3552583f57: pending/publishing. Ainda publicando; confirmar uma vez na próxima retomada, sem presumir concluída. Audiência somente proprietário preservada.
