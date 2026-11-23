# Busca por profissão e cidade — 23/11/2026

A busca anterior comparava maiúsculas/minúsculas, mas diferenciava acentos e espaços internos. A correção normaliza texto Unicode em NFC, remove acentos portugueses para comparação e agrupa espaços, tabs, quebras e espaços inseparáveis. Os dados exibidos e armazenados permanecem originais.

A função buscar_profissionais mantém assinatura, cinco campos públicos, SECURITY INVOKER, search_path vazio, catálogo ativo, ordenação e paginação de 20. Não lê telefones nem documentos, não muda privilégios e não cria extensão ou função auxiliar exposta. Caracteres % e _ continuam literais; parâmetros não são interpolados em SQL dinâmico.

A tela orienta informar somente a cidade, sem UF. Não removemos a UF silenciosamente, porque ainda não há campo próprio de estado para distinguir municípios homônimos.

Teste PGlite cobre maiúsculas, acentos compostos/decompostos, espaços extras/inseparáveis, registros ocultos, campos retornados, consultas literais e paginação sem repetição.
Migração busca_normalizada_profissionais aplicada somente em asdszqtpydiowgerxwee após aprovação dos testes. Nenhum registro é modificado.

## Resultado confirmado
- 225 testes aprovados, zero falhas: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45207837793 . Verificações financeiras, concorrência e prévia isolada passaram.
- Conferência real: um registro de catálogo publicado preservado e encontrado sem acentos. SECURITY INVOKER e ACL original preservados. Auditoria sem novos apontamentos; referências anteriores em docs/VALIDACAO-CADASTROS-HOMOLOGACAO-2026-11-23.md.
- Publicação privada concluída: versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_1968158b67a0819186cf9457eaf62fb2; deployment appgdep_6b045eeb20c881918e2637b4653695e5.
- Fonte da interface 362c5203aab3ec320ed8b95cd9d8bdc7a07e2daf; hospedagem ee0143da4e69caed315013cfef2df39cd4b1885b. Acesso exclusivo do proprietário preservado.
