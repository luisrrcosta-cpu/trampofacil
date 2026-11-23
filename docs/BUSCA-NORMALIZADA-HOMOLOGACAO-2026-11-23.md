# Busca por profissão e cidade — 23/11/2026

A busca anterior comparava maiúsculas/minúsculas, mas diferenciava acentos e espaços internos. A correção normaliza texto Unicode em NFC, remove acentos portugueses para comparação e agrupa espaços, tabs, quebras e espaços inseparáveis. Os dados exibidos e armazenados permanecem originais.

A função buscar_profissionais mantém assinatura, cinco campos públicos, SECURITY INVOKER, search_path vazio, catálogo ativo, ordenação e paginação de 20. Não lê telefones nem documentos, não muda privilégios e não cria extensão ou função auxiliar exposta. Caracteres % e _ continuam literais; parâmetros não são interpolados em SQL dinâmico.

A tela orienta informar somente a cidade, sem UF. Não removemos a UF silenciosamente, porque ainda não há campo próprio de estado para distinguir municípios homônimos.

Teste PGlite cobre maiúsculas, acentos compostos/decompostos, espaços extras/inseparáveis, registros ocultos, campos retornados, consultas literais e paginação sem repetição.
Migração busca_normalizada_profissionais exclusiva de asdszqtpydiowgerxwee, a aplicar após os testes. Nenhum registro é modificado.
