# Cadastro inclusivo — homologação, 23/11/2026

Implementação do plano PLANO-CADASTRO-INCLUSIVO-PRESTADORES.md.
- Novo cadastro profissional e Meu cadastro: pessoa física (CPF), MEI ou empresa (CNPJ), atividade regular ou ocasional.
- Escolhas autodeclaradas; nenhuma promessa de documento verificado ou emissão de nota.
- Nenhum número de CPF/CNPJ é coletado, nem incluído no catálogo público.
- Migração aditiva cadastro_inclusivo_prestadores aplicada somente em asdszqtpydiowgerxwee. Campos nullable preservam o legado; novas gravações pela interface exigem opções válidas. CHECKs do banco impedem valores fora das listas.
- RLS e políticas de propriedade/autenticação mantidas; apenas privilégios das novas colunas para authenticated. Publicação do perfil continua reservada à análise.
- Teste isolado PGlite: seis combinações, legado, CHECKs, acesso alheio, usuário anônimo e tentativa de autopublicação.
- Teste de navegador: seis cadastros completos com API simulada e edição do perfil legado; regressão de cadastro cliente e contratação permanece.
- Chromium local não iniciou por restrição do ambiente (socket). Validação de navegador será executada no GitHub Actions antes da atualização da interface privada.

Próximas etapas separadas: verificação privada de identidade/documentos; requisitos de categorias regulamentadas; solicitação de nota fiscal sem emissão automática. Não coletar documentos completos em campos de texto livres.
Produção e pagamentos reais permanecem sem alteração.
