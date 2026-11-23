# TrampoFácil — Cadastro inclusivo de prestadores (planejamento de implementação)

Data: 2026-11-23. Status: **proposta técnica, sem migração aplicada**.

## Decisões de produto confirmadas
- Cadastro de prestadores como **pessoa física (CPF)**, **MEI** ou **empresa (CNPJ)**.
- Permitir serviços **ocasionais** e profissionais regulares.
- Não exigir CNPJ de todos.
- A modalidade "serviços extras" é de apresentação e descoberta, **não** uma categoria tributária.
- Emissão de NFS-e não pode ser presumida para todo CPF; depende do município, cadastro e enquadramento.
- Comprovante da plataforma não substitui documento fiscal.
- Serviços regulamentados podem exigir habilitação/licença específica.

## Estado observado no Supabase de homologação
`public.profissionais` possui: `id`, `usuario_id`, `nome`, `cidade`,
`servico`, `descricao`, `telefone`, `criado_em`, `publicado`.
Ainda não há colunas próprias para `tipo_prestador` ou `tipo_atividade`.
Também existem `public.clientes` e `public.solicitacoes`.

## Modelo proposto (compatível com registros antigos)
1. `tipo_prestador`: `pessoa_fisica`, `mei`, `empresa`; inicialmente opcional para cadastros legados, obrigatório apenas após migração da interface e validação.
2. `tipo_atividade`: `regular`, `ocasional`; inicialmente opcional para registros legados.
3. `verificacao_identidade`: processo separado e privado, não expor CPF/documentos em perfis públicos.
4. `habilitacao_profissional`: validação específica por categoria regulamentada, antes de publicar quando necessário.
5. `situacao_fiscal`: dados privados mínimos, com permissões por proprietário e administração autorizada.
6. `nota_fiscal`: fluxo separado da contratação, com estados `nao_solicitada`, `solicitada`, `emitida`, `indisponivel`, `erro`; o prestador é o emitente quando aplicável.

## Segurança e privacidade
- **Não** colocar CPF, CNPJ completo, dados bancários ou documentos na tabela de perfil público.
- Criar tabelas privadas com RLS e políticas de titularidade, evitando acesso indiscriminado entre clientes e profissionais.
- Não confiar em `user_metadata` para autorização.
- Evitar `SECURITY DEFINER` como atalho para contornar RLS.
- Definir retenção de documentos, base legal LGPD, revisão de acesso e exclusão.
- Validar a situação fiscal com contador antes de pagamentos reais.

## Plano de execução
1. Mapear as telas atuais e políticas RLS de `profissionais`.
2. Criar testes de compatibilidade e validação das novas modalidades.
3. Elaborar migração aditiva e reversível, com `CHECK` para os valores permitidos.
4. Testar em homologação sem apagar dados e verificar cadastros legados.
5. Atualizar formulários e perfis para distinguir regular/ocasional.
6. Adicionar fluxo de solicitação e entrega de nota fiscal **sem emissão automática na primeira etapa**.
7. Realizar testes de acesso por usuário e de regressão; publicar em produção só com autorização separada.

## Fora do escopo nesta fase
- Habilitar pagamentos reais ou repasses.
- Emitir NFS-e sem integração e credenciamento.
- Cobrar automaticamente tributos de prestadores.
- Modificar a produção.
