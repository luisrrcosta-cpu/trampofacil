# Disponibilidade do profissional — homologação, 23/11/2026

## Comportamento
Meu cadastro > Profissional permite pausar e retomar novos pedidos. Pausar retira o perfil da busca, mas não revoga a aprovação nem altera contratos existentes. Retomar só devolve o perfil à busca se continuar aprovado; não publica perfil pendente.

O botão altera somente pausado. Não grava rascunhos dos outros campos, nem envia mensagens ou operações financeiras. Respostas incertas exigem atualizar o cadastro para conferir; mudança de sessão invalida respostas antigas.

## Banco e segurança
- profissionais.pausado boolean NOT NULL DEFAULT false; legado continua disponível como antes.
- Authenticated ganha apenas leitura/edição dessa coluna, respeitando RLS de titularidade existente.
- Nenhum privilégio de alterar publicado ou políticas novas.
- Sincronizador do catálogo existente usa publicado AND NOT pausado.
- Validador de contratação existente exige publicado AND NOT pausado no INSERT, com lock FOR SHARE para ordenar a criação com edições de disponibilidade. Seu ramo UPDATE permanece igual, mantendo contratos existentes.
- As duas funções existentes preservam assinatura, SECURITY DEFINER, search_path vazio e ACL; não são criados novos atalhos privilegiados.
- Reavaliação de aprovação por mudança material continua ativa; pausado não é alteração material.

## Verificação
Testes isolados cobrem busca durante pausa, bloqueio de novo pedido direto, contratos existentes em andamento, retomada, perfil não aprovado, outro usuário e falta de permissão de publicação. Interface testa rascunho não salvo e atualização por retorno confirmado da API.
Migração disponibilidade_profissional aplicada somente em asdszqtpydiowgerxwee após os testes. Não há exclusão ou edição de registros de contratação.

## Validação e publicação concluídas
Ver docs/RETOMADA-VALIDACAO-INTEGRADA-2026-11-23.md: 230 testes aprovados, fluxo integrado testado no PostgreSQL de homologação com rollback e interface privada publicada. Não reaplicar a migração.
