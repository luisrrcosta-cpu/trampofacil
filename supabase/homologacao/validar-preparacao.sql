-- SOMENTE homologação. Contas fictícias sem senha; tudo é revertido na mesma transação.
BEGIN;
INSERT INTO auth.users(id,aud,role) VALUES
('11111111-4a11-4111-8111-111111111111','authenticated','authenticated'),
('22222222-4a22-4222-8222-222222222222','authenticated','authenticated'),
('33333333-4a33-4333-8333-333333333333','authenticated','authenticated');
INSERT INTO public.clientes(nome,email,telefone,cidade,usuario_id) VALUES('Teste A','a@example.invalid','000','Teste','11111111-4a11-4111-8111-111111111111');
INSERT INTO public.profissionais(id,usuario_id,nome,cidade,servico,telefone,publicado) VALUES('44444444-4a44-4444-8444-444444444444','22222222-4a22-4222-8222-222222222222','Teste B','Teste','Teste','privado',true);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-4a11-4111-8111-111111111111","role":"authenticated"}',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.profissionais)<>0 THEN RAISE EXCEPTION 'FAIL: perfil privado vazou'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.catalogo_profissionais WHERE id='44444444-4a44-4444-8444-444444444444') THEN RAISE EXCEPTION 'FAIL: catalogo indisponivel'; END IF;
END $$;
INSERT INTO public.solicitacoes(cliente_usuario_id,profissional_id,titulo,descricao) VALUES('11111111-4a11-4111-8111-111111111111','44444444-4a44-4444-8444-444444444444','Teste transacional','Solicitacao de teste com rollback');
SELECT set_config('test.request_id',(SELECT id::text FROM public.solicitacoes WHERE titulo='Teste transacional'),true);
DO $$ BEGIN
 BEGIN
  UPDATE public.solicitacoes SET status='aceita',valor_centavos=1 WHERE id=current_setting('test.request_id')::uuid;
  RAISE EXCEPTION 'FAIL: cliente alterou preco';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
SELECT set_config('request.jwt.claims','{"sub":"33333333-4a33-4333-8333-333333333333","role":"authenticated"}',true);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.solicitacoes WHERE id=current_setting('test.request_id')::uuid) THEN RAISE EXCEPTION 'FAIL: terceiro leu pedido'; END IF;
 IF EXISTS(SELECT 1 FROM public.clientes) THEN RAISE EXCEPTION 'FAIL: terceiro leu cliente'; END IF;
 BEGIN
  INSERT INTO public.mensagens_solicitacoes(solicitacao_id,texto) VALUES(current_setting('test.request_id')::uuid,'mensagem indevida');
  RAISE EXCEPTION 'FAIL: terceiro enviou mensagem';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
SELECT set_config('request.jwt.claims','{"sub":"22222222-4a22-4222-8222-222222222222","role":"authenticated"}',true);
UPDATE public.solicitacoes SET status='proposta',valor_centavos=15000 WHERE id=current_setting('test.request_id')::uuid;
INSERT INTO public.mensagens_solicitacoes(solicitacao_id,texto) VALUES(current_setting('test.request_id')::uuid,'Orcamento enviado.');
SELECT set_config('request.jwt.claims','{"sub":"11111111-4a11-4111-8111-111111111111","role":"authenticated"}',true);
UPDATE public.solicitacoes SET status='aceita' WHERE id=current_setting('test.request_id')::uuid;

RESET ROLE;
SET LOCAL ROLE service_role;
DO $$
DECLARE a private.preparacoes_pagamento%rowtype;
        b private.preparacoes_pagamento%rowtype;
        versao timestamptz;
BEGIN
 SELECT atualizado_em INTO versao FROM public.solicitacoes WHERE id=current_setting('test.request_id')::uuid;
 a := private.registrar_preparacao_pagamento(current_setting('test.request_id')::uuid,
   '11111111-4a11-4111-8111-111111111111',versao,'credito_parcelado',10);
 b := private.registrar_preparacao_pagamento(current_setting('test.request_id')::uuid,
   '11111111-4a11-4111-8111-111111111111',versao,'credito_parcelado',10);
 IF a.id<>b.id OR a.valor_servico_centavos<>15000 OR a.comissao_centavos<>1500
   OR a.profissional_centavos<>13500 OR a.pagamento_habilitado OR a.estado<>'preparada'
   OR (SELECT count(*) FROM private.preparacoes_pagamento WHERE solicitacao_id=a.solicitacao_id)<>1 THEN
   RAISE EXCEPTION 'FAIL: preparacao duplicada ou valores incorretos';
 END IF;
 BEGIN
  PERFORM private.registrar_preparacao_pagamento(a.solicitacao_id,a.cliente_usuario_id,versao,'credito_avista',1);
  RAISE EXCEPTION 'FAIL: repeticao com condicoes diferentes';
 EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
 BEGIN
  PERFORM private.registrar_preparacao_pagamento(a.solicitacao_id,a.cliente_usuario_id,versao - interval '1 microsecond','credito_parcelado',10);
  RAISE EXCEPTION 'FAIL: versao antiga aceita';
 EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
 BEGIN
  PERFORM private.registrar_preparacao_pagamento(a.solicitacao_id,'33333333-4a33-4333-8333-333333333333',versao,'credito_parcelado',10);
  RAISE EXCEPTION 'FAIL: identidade de terceiro aceita';
 EXCEPTION WHEN no_data_found THEN NULL;
 END;
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN
  PERFORM 1 FROM private.preparacoes_pagamento;
  RAISE EXCEPTION 'FAIL: cliente leu registro interno';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  PERFORM private.registrar_preparacao_pagamento(current_setting('test.request_id')::uuid,
    '11111111-4a11-4111-8111-111111111111',now(),'credito_avista',1);
  RAISE EXCEPTION 'FAIL: cliente executou registro interno';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;

SELECT set_config('request.jwt.claims','{"sub":"22222222-4a22-4222-8222-222222222222","role":"authenticated"}',true);
DO $$ BEGIN
 BEGIN
  UPDATE public.solicitacoes SET status='em_andamento',valor_centavos=20000 WHERE id=current_setting('test.request_id')::uuid;
  RAISE EXCEPTION 'FAIL: profissional mudou preco aceito';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
UPDATE public.solicitacoes SET status='em_andamento' WHERE id=current_setting('test.request_id')::uuid;
UPDATE public.solicitacoes SET status='entregue' WHERE id=current_setting('test.request_id')::uuid;
SELECT set_config('request.jwt.claims','{"sub":"11111111-4a11-4111-8111-111111111111","role":"authenticated"}',true);
UPDATE public.solicitacoes SET status='concluida' WHERE id=current_setting('test.request_id')::uuid;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.solicitacoes WHERE id=current_setting('test.request_id')::uuid AND status='concluida' AND valor_centavos=15000) THEN RAISE EXCEPTION 'FAIL: fluxo incompleto'; END IF;
 IF (SELECT count(*) FROM public.historico_solicitacoes WHERE solicitacao_id=current_setting('test.request_id')::uuid)<>6 THEN RAISE EXCEPTION 'FAIL: historico incompleto'; END IF;
 BEGIN
 INSERT INTO public.mensagens_solicitacoes(solicitacao_id,texto) VALUES(current_setting('test.request_id')::uuid,'apos conclusao');
 RAISE EXCEPTION 'FAIL: mensagem apos fechamento';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
RESET ROLE;
SET LOCAL ROLE service_role;
DO $$ BEGIN
 BEGIN
  PERFORM private.registrar_preparacao_pagamento(current_setting('test.request_id')::uuid,
    '11111111-4a11-4111-8111-111111111111',
    (SELECT atualizado_em FROM public.solicitacoes WHERE id=current_setting('test.request_id')::uuid),
    'credito_parcelado',10);
  RAISE EXCEPTION 'FAIL: pedido concluido preparou pagamento';
 EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
END $$;
ROLLBACK;
SELECT 'APROVADO: preparacao unica, divisao 90/10, versao e identidade protegidas, acesso privado, fluxo completo e rollback' AS resultado;

