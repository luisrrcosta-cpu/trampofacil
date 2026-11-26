# Limite de paginação do catálogo — 26/11/2026

Implementado e aplicado apenas em TrampoFacil-Homologacao, asdszqtpydiowgerxwee.

## Problema e mudança

A interface rejeitava páginas acima de 10000, mas public.buscar_profissionais aceitava qualquer integer e calculava OFFSET sem esse limite. Uma chamada direta podia pedir um deslocamento muito superior ao suportado pela interface. Não foi medido incidente de indisponibilidade; trata-se de endurecimento preventivo.

A função agora retorna vazio para pagina > 10000 e limita o OFFSET a 200000. Páginas negativas e nulas preservam o comportamento anterior de página inicial. Permanecem 20 resultados por página, mesmos cinco campos públicos, normalização de acentos/espaços e RLS do catálogo. Esta medida não é um limitador de frequência nem substitui monitoramento ou estratégia de paginação por cursor.

## Evidências

- SQL versionado: 2bd0d4dc72e0d9f32f5fec17ec95f49714a60845.
- Testes: 2e957e83dee3cdc196e14a7eb64e37e0ba09285d.
- CI geral/interface 45873994148, financeiro 45873995111 e concorrência 45873994052: success.
- PGlite testa páginas normais, ocultação de perfil inativo, acentos, curingas literais, página negativa/nula e páginas 10000/10001/2147483647.
- Migração limitar_paginacao_catalogo_profissionais retornou success.
- Verificação pós-aplicação em transação READ ONLY sob papel anon: página 10001 vazia, página máxima integer vazia e primeira página com até 20 resultados, todos true. Somente agregados retornados; nenhum perfil pessoal exposto.
- Metadados após aplicação: invoker, search_path vazio, EXECUTE anon/authenticated preservado, condição e OFFSET limitados presentes.

Advisors antes/depois iguais: nove INFO em tabelas privadas deliberadamente bloqueadas por RLS sem política e um WARN preexistente de proteção contra senhas vazadas. Nenhuma configuração Auth modificada.

Referências dos avisos: [RLS sem política](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) e [proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Sem alterações de registros, produção, audiência do site ou operações financeiras. A interface publicada permanece na fonte 74d7f208d51520698622601a86bfe346d64a9838; esta entrega altera somente a função de busca na homologação e os arquivos SQL/testes/documentação.
