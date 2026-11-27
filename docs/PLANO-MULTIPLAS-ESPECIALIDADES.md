# Múltiplas especialidades — implementação em homologação

Implementação de 27/11/2026 validada por CI (284 testes e regressões), aplicada somente na homologação. A disponibilidade da nova interface depende da conclusão da publicação privada registrada abaixo.

## Modelo revisado após inspeção
A proposta de tabela privada isolada não foi aplicada. A implementação usa array especialidades (até 10) na própria linha de profissionais e projeção correspondente no catálogo. A edição é atômica com os outros campos e disputa o mesmo lock já usado na aprovação por versão. Evita gravações parciais e uma segunda fonte de versões. servico permanece a profissão principal.

A coluna profissional segue RLS de titularidade existente e grants por coluna. O catálogo mantém RLS ativo/publicado. Alteração de especialidades retira publicação e o catálogo fica inativo na mesma transação; não publica uma especialidade nova automaticamente. Sem mudança de políticas existentes ou concessão para editar publicado.

## Interface e revisão
Cadastro e Meu cadastro recebem lista opcional, uma especialidade por linha. Valida limites, duplicatas, serviço principal, Unicode e controles. Remoção completa envia lista vazia; logout e confirmação de saída incluem a nova edição.

Fila administrativa mostra a lista integral e inclui todas as especialidades no snapshot de aprovação, ajuste e recusa. Snapshot antigo falha após alteração. Histórico de decisões preservado; perfil legado com lista vazia mantém formato de snapshot antigo, sem inventar especialidades/aceites retroativos.

Busca encontra profissão principal ou especialidade, com cidade e paginação existentes e sem duplicar perfis. A resposta pública mantém os cinco campos atuais; o cartão mostra o serviço principal. Detalhar a especialidade contratada continua parte da descrição do pedido, sem modificar pedidos antigos. Lista e aprovação não comprovam habilitação profissional.

## Testes
PGlite: validação no servidor, isolamento entre contas/anônimo, snapshot antigo, aprovação idempotente, busca/cidade, retirada após edição, recusa e compatibilidade legada. Unitários de normalização/limites/duplicidade. Navegador CI: cadastro, edição, remoção, snapshot integral e largura 320px. PostgreSQL CI: três disputas adicionais em conexões independentes (edição antes/depois da aprovação e aprovação repetida), além dos cenários existentes.

Migração gerada pelo CLI: supabase/migrations/20261127134954_especialidades_profissionais_homologacao.sql. Não reaplicar o SQL privado de preparação anterior. Nenhum dado financeiro, produção ou alteração de audiência.

## Aplicação e publicação

Código f2fdc90edf66d1f0b59158e8507d340b83dedc8a; CI 46011312669, 46011312676, 46011312736, 46011312885 e 46011312645 success. Verificação posterior de RLS, grants, triggers e consulta realizada sem criar especialidades em perfis reais. Fonte privada 7e7f7637b918b3fa062212b12f7d5e914d2922fc; versão appgprj_6afeee187e488191b1c58ef23f6f0a98~appgver_ec806b92da888191883db233a6cdff1f; publicação appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_fc458be0818081919fb26b1a9a3261e2: pending/publishing. Ainda publicando; conferir uma vez na próxima retomada. Acesso somente do proprietário preservado.
