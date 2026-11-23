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
