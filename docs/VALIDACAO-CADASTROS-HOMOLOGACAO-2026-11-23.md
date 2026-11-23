# Validação dos cadastros — homologação, 23/11/2026

## Problema e correção
A interface tinha limites HTML, mas os campos básicos de clientes e profissionais não tinham CHECKs de conteúdo no banco. Envios diretos à API podiam ultrapassar esses limites.

A migração validar_conteudo_cadastros adiciona nove CHECKs:
- Nome e cidade: obrigatórios, entre 2 e 120 caracteres após remover espaços externos, sem controles/quebras de linha.
- Telefone: obrigatório, de 10 a 15 dígitos, com sinal + opcional. A interface normaliza a formatação antes do envio.
- Cliente: e-mail obrigatório, formato básico e até 254 caracteres.
- Profissional: serviço obrigatório com 2 a 120 caracteres; descrição opcional até 1.000, permitindo parágrafos.

A consulta prévia retornou um cliente e um profissional, ambos compatíveis. Nenhum registro foi editado ou removido. Restrições são adicionadas NOT VALID e validadas na mesma migração; falhas devem abortar a migração, sem corrigir dados automaticamente.

Validação JavaScript passa a aplicar também os limites, formato do e-mail e caracteres de controle antes do envio. A edição de profissional não exige e-mail no campo oculto: essa tela não altera a identidade de acesso.

## Segurança e escopo
RLS, privilégios, publicação, autenticação, produção e pagamentos permanecem sem alteração. Estas verificações são de formato; não comprovam CPF, CNPJ, telefone, habilitação profissional ou situação fiscal.
Testes isolados cobrem gravações diretas inválidas, campos nulos, limites, preservação de dados, parágrafos e a edição profissional sem e-mail oculto.
Referência técnica: https://www.postgresql.org/docs/17/ddl-constraints.html

## Resultado
- Migração aplicada e validada: quatro CHECKs em clientes e cinco em profissionais, com RLS ativa nas duas tabelas.
- GitHub Actions do commit e00e75f: 214 testes aprovados, zero falhas. Também passaram testes financeiros, concorrência PostgreSQL e preparação da prévia isolada.
- Evidência: https://github.com/luisrrcosta-cpu/trampofacil/actions/runs/45179067277
- Interface privada atualizada com sucesso, versão 9; acesso continua exclusivo do proprietário.
- Auditoria de saúde sem alertas; segurança sem novos achados. Permanecem os apontamentos anteriores: tabelas financeiras privadas sem políticas permissivas (bloqueio intencional) e proteção de senhas vazadas desativada, enquanto o fluxo atual usa OTP.
- Referências dos apontamentos: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
