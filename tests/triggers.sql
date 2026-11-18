-- Cópia dos triggers de solicitação existentes, para testes locais.
CREATE OR REPLACE FUNCTION private.validar_solicitacao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE ator uuid := auth.uid();
BEGIN
 IF ator IS NULL THEN RAISE EXCEPTION 'Entre na sua conta para continuar.' USING ERRCODE='42501'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.cliente_usuario_id<>ator OR NOT EXISTS(SELECT 1 FROM public.clientes WHERE usuario_id=ator) THEN
   RAISE EXCEPTION 'Complete seu cadastro de cliente.' USING ERRCODE='42501';
  END IF;
  SELECT usuario_id INTO NEW.profissional_usuario_id FROM public.profissionais WHERE id=NEW.profissional_id AND publicado;
  IF NEW.profissional_usuario_id IS NULL OR NEW.profissional_usuario_id=ator THEN RAISE EXCEPTION 'Profissional indisponível.' USING ERRCODE='42501'; END IF;
  NEW.status:='solicitada'; NEW.valor_centavos:=NULL; NEW.criado_em:=now();
 ELSE
  IF (NEW.id,NEW.cliente_usuario_id,NEW.profissional_id,NEW.profissional_usuario_id,NEW.titulo,NEW.descricao,NEW.criado_em)
    IS DISTINCT FROM (OLD.id,OLD.cliente_usuario_id,OLD.profissional_id,OLD.profissional_usuario_id,OLD.titulo,OLD.descricao,OLD.criado_em)
    THEN RAISE EXCEPTION 'Os dados originais da solicitação não podem ser alterados.' USING ERRCODE='42501'; END IF;
  IF ator=OLD.profissional_usuario_id THEN
   IF NOT ((OLD.status IN('solicitada','proposta') AND NEW.status='proposta' AND NEW.valor_centavos IS NOT NULL)
     OR (OLD.status='aceita' AND NEW.status='em_andamento')
     OR (OLD.status='em_andamento' AND NEW.status='entregue')
     OR (OLD.status IN('solicitada','proposta','aceita') AND NEW.status='cancelada'))
     THEN RAISE EXCEPTION 'Alteração não permitida ao profissional.' USING ERRCODE='42501'; END IF;
   IF NOT(OLD.status IN('solicitada','proposta') AND NEW.status='proposta') AND NEW.valor_centavos IS DISTINCT FROM OLD.valor_centavos
     THEN RAISE EXCEPTION 'O valor aceito não pode ser alterado.' USING ERRCODE='42501'; END IF;
  ELSIF ator=OLD.cliente_usuario_id THEN
   IF NEW.valor_centavos IS DISTINCT FROM OLD.valor_centavos OR NOT (
     (OLD.status='proposta' AND NEW.status='aceita' AND OLD.valor_centavos IS NOT NULL)
     OR (OLD.status='entregue' AND NEW.status='concluida')
     OR (OLD.status IN('solicitada','proposta','aceita') AND NEW.status='cancelada'))
     THEN RAISE EXCEPTION 'Alteração não permitida ao cliente.' USING ERRCODE='42501'; END IF;
  ELSE RAISE EXCEPTION 'Acesso negado.' USING ERRCODE='42501';
  END IF;
 END IF;
 NEW.atualizado_em:=now();
 RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION private.registrar_solicitacao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
 INSERT INTO public.historico_solicitacoes(solicitacao_id,ator_usuario_id,status,valor_centavos)
 VALUES(NEW.id,auth.uid(),NEW.status,NEW.valor_centavos);
 RETURN NEW;
END $function$
;
