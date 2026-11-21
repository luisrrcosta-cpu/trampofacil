-- Teste reversível de orçamento obsoleto e valor divergente.
-- Executar SOMENTE no projeto TrampoFacil-Homologacao.
-- Dados fictícios e nenhuma cobrança real; ROLLBACK ao final.
BEGIN;
INSERT INTO auth.users(id) VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2');
INSERT INTO public.clientes(usuario_id,nome,email,telefone,cidade) VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','Cliente Teste','cliente-teste@example.invalid','000000000','Cidade fictícia');
INSERT INTO public.profissionais(id,usuario_id,nome,cidade,servico,publicado) VALUES ('cccccccc-cccc-4ccc-8ccc-ccccccccccc1','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2','Profissional Teste','Cidade fictícia','Serviço fictício',true);
SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',true);
INSERT INTO public.solicitacoes(id,cliente_usuario_id,profissional_id,profissional_usuario_id,titulo,descricao)
VALUES ('dddddddd-dddd-4ddd-8ddd-ddddddddddd1','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','cccccccc-cccc-4ccc-8ccc-ccccccccccc1','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2','Teste de contratação','Descrição fictícia com mais de dez caracteres');
SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',true);
UPDATE public.solicitacoes SET status='proposta',valor_centavos=10000 WHERE id='dddddddd-dddd-4ddd-8ddd-ddddddddddd1';
SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',true);
UPDATE public.solicitacoes SET status='aceita' WHERE id='dddddddd-dddd-4ddd-8ddd-ddddddddddd1';
-- Caso 1: valor correto, mas versão do orçamento anterior à aceita.
INSERT INTO private.preparacoes_pagamento(id,solicitacao_id,cliente_usuario_id,profissional_usuario_id,versao_orcamento,valor_servico_centavos,comissao_centavos,profissional_centavos,forma,parcelas)
SELECT 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',s.id,s.cliente_usuario_id,s.profissional_usuario_id,s.atualizado_em-interval '1 second',10000,1000,9000,'credito_avista',1
FROM public.solicitacoes s WHERE s.id='dddddddd-dddd-4ddd-8ddd-ddddddddddd1';
-- Caso 2: versão correta, mas valor 12000 em vez de 10000 centavos.
INSERT INTO private.preparacoes_pagamento(id,solicitacao_id,cliente_usuario_id,profissional_usuario_id,versao_orcamento,valor_servico_centavos,comissao_centavos,profissional_centavos,forma,parcelas)
SELECT 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',s.id,s.cliente_usuario_id,s.profissional_usuario_id,s.atualizado_em,12000,1200,10800,'credito_avista',1
FROM public.solicitacoes s WHERE s.id='dddddddd-dddd-4ddd-8ddd-ddddddddddd1';
SET LOCAL ROLE service_role;
DO $$
DECLARE id uuid;
BEGIN
 FOREACH id IN ARRAY ARRAY['eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1'::uuid,'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2'::uuid]
 LOOP
  BEGIN
   PERFORM private.registrar_tentativa_inerte(id,gen_random_uuid());
   RAISE EXCEPTION 'FALHA: tentativa indevida para %',id;
  EXCEPTION WHEN OTHERS THEN
   IF SQLERRM NOT LIKE 'Contratação alterada ou indisponível%' THEN RAISE; END IF;
  END;
 END LOOP;
 IF EXISTS(SELECT 1 FROM private.tentativas_pagamento_teste WHERE preparacao_id IN ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2'))
 THEN RAISE EXCEPTION 'FALHA: tentativa indevida persistiu'; END IF;
END $$;
ROLLBACK;
