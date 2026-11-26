# Revisão do painel administrativo — 26/11/2026

Escopo: leitura do código da branch codex/v16-seguranca-integracoes e validação automática no GitHub Actions. Não é auditoria independente nem conferência atual das configurações implantadas no Supabase. Nenhuma alteração de SQL, RLS, grants, revisores ou dados foi executada nesta etapa.

## Controles observados no código

| Operação | Controle observado | Evidência |
| --- | --- | --- |
| Listar fila | Identidade autenticada, revisor ativo na tabela privada, paginação limitada e exclusão do próprio perfil | supabase/homologacao/painel_revisao_perfis.sql; recusa_publicacao_perfil.sql |
| Aprovar | Revisor ativo sob lock; impede autoaprovação; exige pedido de análise e versão exata do perfil; repetição compatível retorna evento existente | estrutura_interna_revisao_perfis.sql; testes/painel-revisao |
| Recusar | Revisor ativo sob lock; impede decisão sobre si; motivos enumerados; pedido obrigatório e versão exata; eventos internos sem bloqueio de contratos | recusa_publicacao_perfil.sql; tests/recusa-publicacao.test.js |
| Consulta do profissional | RPC sem UUID de terceiro; usa auth.uid; retorna motivo, data e indicação de perfil alterado | recusa_publicacao_perfil.sql; consultarRecusaProfissional em perfil.js |
| Apresentação | Validação de respostas, texto sem innerHTML e descarte de resposta de sessão/consulta superada | perfil.js; tests/browser.test.js |

Os testes existentes cobrem falsa alegação administrativa em user_metadata, revisor revogado, identidade anônima, acesso direto a tabelas privadas, versão divergente, repetição e consulta por outra conta. A aprovação mantém a pausa do profissional. Esta etapa não comprova segurança de todos os componentes ou ausência de outros problemas.

## Melhoria implementada

- Fila administrativa mostra a solicitação de análise e a última recusa com data/hora explícita de Brasília.
- Consulta do profissional mostra a data da orientação e da recusa, distinguindo decisão antiga de perfil posteriormente alterado.
- Elemento time mantém datetime ISO; horário visível usa America/Sao_Paulo.
- Falha de consulta e troca de conta eliminam a data anterior junto do status. Sem nova requisição ou dado coletado.
- Texto de motivo e instruções anteriores preservados; nenhuma regra de aprovação/recusa mudou.

Código: 0b5d95e27a8654c2b4550d44a11c38fa136b0852.
Testes: ac0b91b449d9f036b67a73fb863ad538f8a66e5d.

## Validação

- Geral/interface e regressões: 45833974781 success.
- Financeiro: 45833974971 success.
- Concorrência PostgreSQL isolada: 45833974850 success.
- Pacote de prévia: 45833971649 success na implementação.
- Teste de navegador verifica datetime, conversão 18:00 UTC para 15:00 Brasília, retirada da data após erro de orientação e limpeza na troca de conta.

## Publicação pendente

Ambiente local continua indisponível. Código validado e salvo somente no GitHub; não apresentar esta melhoria como publicada.

Na retomada da publicação, sincronizar servicos.js (preservação de propostas, commit 0452d8f68a360a1814aad6daafaa31087e2d331c) e perfil.js (datas, commit ac0b91b449d9f036b67a73fb863ad538f8a66e5d) com os respectivos dist/ da fonte Sites, após abertura pelo helper. Comparar com a branch atual para incluir alterações posteriores autorizadas, sem substituí-las cegamente. Empacotar e publicar mantendo acesso exclusivo do proprietário.

Prévia atualmente confirmada: fonte c901b840a226f08576aed724081f6229a274d1c2; deployment appgprj_6afeee187e488191b1c58ef23f6f0a98~appgdep_ac0ed81dd0d881919426a94a7e9cfa2a.

PagBank adiado. Nenhum checkout reenviado, pagamento real ativado ou alteração de produção.


## Negativa de acesso durante uma decisão
- Lacuna encontrada na interface: HTTP 403 nas decisões usava mensagem genérica de resultado não confirmado. O servidor já negava a operação; não foi encontrada autorização indevida neste cenário.
- Listagem, aprovação, pedido de ajuste e recusa agora compartilham limpeza da fila e paginação e mensagem de área restrita quando o servidor responde 403. A rotina não modifica papel, token ou permissão e não repete a operação.
- Falhas de rede/resposta perdida continuam usando a orientação de consulta antes de repetir. Sessão expirada (401) mantém fluxo de novo login. Respostas de sessão superada continuam ignoradas pelas guardas existentes.
- Teste de navegador carrega fila, simula negativa de autorização antes de cada uma das três decisões, confere lista vazia, paginação oculta, controles liberados e uma única tentativa negada. Nenhuma gravação adicional é realizada pela API fictícia.
- Código 80297aa5ba9edaed1dcb623cab7c7f553ccec678; testes f5f4278e980f1857e0e7c7ed5425207fec66d090.
- CI geral/interface/regressões 45834717676, financeiro 45834717900, concorrência 45834717773 e pacote 45834715042: success. As verificações financeiras e de concorrência não demonstram execução financeira real ou alteração do banco remoto.
- Salvo e validado no GitHub, ainda não publicado. Na sincronização futura usar perfil.js atual da branch para incluir também esta correção, além das datas; servicos.js pendente da preservação automática deve ser incluído. Preservar acesso privado e não modificar produção.
