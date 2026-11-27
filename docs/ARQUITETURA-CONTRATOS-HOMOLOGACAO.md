# Arquitetura de contratos — proposta 27/11/2026
Inspeção somente leitura da homologação asdszqtpydiowgerxwee confirmou public.solicitacoes(id, cliente_usuario_id, profissional_id, profissional_usuario_id, titulo, descricao, status, valor_centavos, criado_em, atualizado_em). Não há tabela pública com nome contendo contrat ou aceite. Histórico registra ator/status/valor/data. Não confundir aceite de orçamento com assinatura contratual.
## Lacunas
O pedido atual tem valor único, sem discriminação de materiais, prazo ou especificações estruturadas. Não inventar esses dados nem converter pedidos antigos em contratos assinados.
## Modelo proposto
contratos_servico: UUID, solicitacao_id, revisão positiva, versão de minuta aprovada, snapshot canônico integral, hash SHA-256, data servidor, vínculo à revisão anterior; unicidade pedido/revisão. Snapshot inclui participantes, escopo, materiais, mão de obra, prazo e condições; valores inteiros em centavos, soma validada. Dados privados.
aceites_contrato: contrato_id, usuario_id derivado de auth.uid(), hash confirmado, data servidor, referência de sessão verificada conforme política; unicidade contrato/usuario. Sem UPDATE/DELETE direto. Não armazenar OTP.
## Fluxo
Criar versão somente após orçamento completo e aprovação de minuta para ensaio. Leitura restrita às duas partes. RPC transacional de aceite confere sessão, participante, revisão vigente e hash exibido; lock no pedido em ordem consistente; repetição idempotente. Novo orçamento gera revisão e invalida suficiência dos aceites anteriores sem apagá-los. Início deve verificar ambos os aceites da versão vigente no mesmo lock/transação; preservar pedidos históricos mediante regra explícita de elegibilidade. Inspecionar trigger validar_solicitacao e grants antes de implementar; não criar caminho paralelo que contorne regras.
## Testes obrigatórios
Terceiro e anônimo não leem nem assinam; cliente não assina pelo profissional; versão obsoleta rejeitada; alteração de hash rejeitada; aceite duplicado não cria evento; corrida aceite/alteração/início não libera versão errada; início com zero ou um aceite bloqueado; dois aceites válidos permitem apenas transição já autorizada; histórico preservado; sem efeito financeiro; PDF corresponde ao snapshot; sessão expirada ou substituída não assina.
## Limites
Proposta não implementada. Nenhuma DDL, mudança de RLS, aceite real ou teste executável neste commit. Antes da migração, conferir funções/triggers, documentação atual Supabase, ambiente local e CI; aprovar textos e estratégia de autenticação. Não ativar produção nem pagamentos. Minutas anteriores continuam não vigentes.


## Base executável de rascunho — 27/11/2026

contratos-core.js implementa prepararRascunhoContrato e serializarRascunhoContrato. Valida IDs, partes distintas, presença dos dados, escopo e condições, discriminação de materiais/mão de obra em centavos, total e cronologia de datas civis. Normaliza Unicode/quebras de linha; serialização de formato próprio v1 independente da ordem das propriedades de entrada. Retorno imutável em memória, sem persistência ou autenticação. Valores seguem os limites técnicos atuais de orçamento do aplicativo; não definem condições legais de garantia.

O identificador de minuta passado ao módulo não atesta aprovação ou vigência. O servidor ainda deverá selecionar a minuta em registro confiável, derivar as partes do pedido autenticado, conferir orçamento e revisão atual, calcular SHA-256, persistir o snapshot, obter aceites individuais e bloquear início sob o mesmo lock. Não confiar nos UUIDs fornecidos ao helper como autorização. Não é implementação de assinatura, hash, PDF, termo vigente ou prova de autoria; não altera pedidos antigos, RLS ou pagamentos.

Testes executáveis em tests/contratos-core.test.js cobrem valores fracionários/negativos/excessivos, soma, datas inexistentes e ano bissexto, partes iguais, ausência e campos financeiros extras, normalização, ordem de entrada e mudança de conteúdo. CI deve estar aprovada antes de integrar esse módulo ao servidor ou interface.

Validação confirmada: commit e91eaec4db60f899334fa1b2e45e12a1f0b5642b, CI 46025053481 com 289 testes e regressões aprovados; financeiro 46025053516, concorrência 46025053500 e pacote 46025053450 success. Nenhuma migração ou ativação de aceites nesta etapa.

## Armazenamento privado de versões — preparação executável de 27/11/2026

SQL candidato em supabase/homologacao/versoes_rascunho_contrato.sql; ainda não aplicado à homologação. Sem RPC pública, permissões comuns, aceites ou alteração de fluxo de pedidos. A confirmação somente leitura do banco encontrou ausência de tabelas contratuais/aceites e presença de sha256(bytea).

A tabela de versões de rascunho tem RLS e nenhum acesso direto para anon, authenticated ou service_role. Cada versão se vincula ao pedido, à revisão anterior do mesmo pedido e à versão temporal do orçamento. O trigger de inserção serializa no lock da solicitação, exige parte autenticada/não anônima, orçamento atual e valores correspondentes. A identidade e a data são derivadas no servidor, sobrepondo dados fornecidos ao inserir. Revisões obsoletas falham; UPDATE/DELETE de versões são bloqueados.

O conteúdo JSON serializado é preservado integralmente e comparado ao snapshot jsonb. Hash SHA-256 calculado no banco sobre os bytes UTF-8, sem aceitar um hash fornecido como prova. A futura RPC deverá usar o serializador v1 e validar o módulo contratos-core; equivalência jsonb isolada não comprova formato canônico ou autoria. Não é assinatura eletrônica, aceite, aprovação de minuta ou contrato vigente.

Testes isolados em PGlite comparam o hash a node:crypto e cobrem cadeia de revisões, orçamento alterado, conteúdo divergente, parte alheia/anônima, permissões comuns, ator/data/hash fornecidos pelo chamador e bloqueio de edição/exclusão. Ainda faltam disputa em PostgreSQL de conexões independentes para as novas versões, idempotência da RPC por operação, registro confiável de minutas, autenticação/sessão, leitura pelas partes, aceites, PDF e bloqueio de início. Nada disso é demonstrado apenas pelo sucesso da suíte geral.

Sem executor disponível, não foi gerada nem aplicada uma nova migração. Não executar o SQL candidato manualmente como atalho: gerar a migração pelo CLI quando disponível, terminar a API e os testes de concorrência e só então aplicar em homologação. Produção e dados existentes intactos.
