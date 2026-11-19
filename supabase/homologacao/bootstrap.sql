-- Estrutura sem dados; somente projeto NOVO de homologação.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
CREATE TABLE public."catalogo_profissionais" (
  "id" uuid NOT NULL,
  "nome" text NOT NULL,
  "cidade" text NOT NULL,
  "servico" text NOT NULL,
  "descricao" text,
  "ativo" boolean DEFAULT false NOT NULL
);
ALTER TABLE public."catalogo_profissionais" ENABLE ROW LEVEL SECURITY;
CREATE TABLE public."clientes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "nome" text NOT NULL,
  "email" text NOT NULL,
  "telefone" text NOT NULL,
  "cidade" text NOT NULL,
  "criado_em" timestamp with time zone DEFAULT now(),
  "usuario_id" uuid NOT NULL
);
ALTER TABLE public."clientes" ENABLE ROW LEVEL SECURITY;
CREATE TABLE public."historico_solicitacoes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "solicitacao_id" uuid NOT NULL,
  "ator_usuario_id" uuid NOT NULL,
  "status" text NOT NULL,
  "valor_centavos" integer,
  "criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public."historico_solicitacoes" ENABLE ROW LEVEL SECURITY;
CREATE TABLE public."mensagens_solicitacoes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "solicitacao_id" uuid NOT NULL,
  "autor_usuario_id" uuid DEFAULT auth.uid() NOT NULL,
  "texto" text NOT NULL,
  "criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public."mensagens_solicitacoes" ENABLE ROW LEVEL SECURITY;
CREATE TABLE public."profissionais" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "usuario_id" uuid NOT NULL,
  "nome" text NOT NULL,
  "cidade" text NOT NULL,
  "servico" text NOT NULL,
  "descricao" text,
  "telefone" text,
  "criado_em" timestamp with time zone DEFAULT now(),
  "publicado" boolean DEFAULT false NOT NULL
);
ALTER TABLE public."profissionais" ENABLE ROW LEVEL SECURITY;
CREATE TABLE public."solicitacoes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "cliente_usuario_id" uuid NOT NULL,
  "profissional_id" uuid NOT NULL,
  "profissional_usuario_id" uuid NOT NULL,
  "titulo" text NOT NULL,
  "descricao" text NOT NULL,
  "status" text DEFAULT 'solicitada'::text NOT NULL,
  "valor_centavos" integer,
  "criado_em" timestamp with time zone DEFAULT now() NOT NULL,
  "atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public."solicitacoes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."catalogo_profissionais" ADD CONSTRAINT "catalogo_profissionais_pkey" PRIMARY KEY (id);
ALTER TABLE public."clientes" ADD CONSTRAINT "clientes_pkey" PRIMARY KEY (id);
ALTER TABLE public."clientes" ADD CONSTRAINT "clientes_usuario_id_key" UNIQUE (usuario_id);
ALTER TABLE public."historico_solicitacoes" ADD CONSTRAINT "historico_solicitacoes_pkey" PRIMARY KEY (id);
ALTER TABLE public."mensagens_solicitacoes" ADD CONSTRAINT "mensagens_solicitacoes_pkey" PRIMARY KEY (id);
ALTER TABLE public."mensagens_solicitacoes" ADD CONSTRAINT "mensagens_solicitacoes_texto_check" CHECK (((length(TRIM(BOTH FROM texto)) >= 1) AND (length(TRIM(BOTH FROM texto)) <= 2000)));
ALTER TABLE public."profissionais" ADD CONSTRAINT "profissionais_pkey" PRIMARY KEY (id);
ALTER TABLE public."profissionais" ADD CONSTRAINT "profissionais_usuario_id_key" UNIQUE (usuario_id);
ALTER TABLE public."solicitacoes" ADD CONSTRAINT "solicitacoes_check" CHECK ((cliente_usuario_id <> profissional_usuario_id));
ALTER TABLE public."solicitacoes" ADD CONSTRAINT "solicitacoes_descricao_check" CHECK (((length(TRIM(BOTH FROM descricao)) >= 10) AND (length(TRIM(BOTH FROM descricao)) <= 3000)));
ALTER TABLE public."solicitacoes" ADD CONSTRAINT "solicitacoes_pkey" PRIMARY KEY (id);
ALTER TABLE public."solicitacoes" ADD CONSTRAINT "solicitacoes_status_check" CHECK ((status = ANY (ARRAY['solicitada'::text, 'proposta'::text, 'aceita'::text, 'em_andamento'::text, 'entregue'::text, 'concluida'::text, 'cancelada'::text])));
ALTER TABLE public."solicitacoes" ADD CONSTRAINT "solicitacoes_titulo_check" CHECK (((length(TRIM(BOTH FROM titulo)) >= 3) AND (length(TRIM(BOTH FROM titulo)) <= 120)));
ALTER TABLE public."solicitacoes" ADD CONSTRAINT "solicitacoes_valor_centavos_check" CHECK (((valor_centavos >= 100) AND (valor_centavos <= 100000000)));
ALTER TABLE public."catalogo_profissionais" ADD CONSTRAINT "catalogo_profissionais_id_fkey" FOREIGN KEY (id) REFERENCES profissionais(id) ON DELETE CASCADE;
ALTER TABLE public."clientes" ADD CONSTRAINT "clientes_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES auth.users(id);
ALTER TABLE public."historico_solicitacoes" ADD CONSTRAINT "historico_solicitacoes_ator_usuario_id_fkey" FOREIGN KEY (ator_usuario_id) REFERENCES auth.users(id);
ALTER TABLE public."historico_solicitacoes" ADD CONSTRAINT "historico_solicitacoes_solicitacao_id_fkey" FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes(id);
ALTER TABLE public."mensagens_solicitacoes" ADD CONSTRAINT "mensagens_solicitacoes_autor_usuario_id_fkey" FOREIGN KEY (autor_usuario_id) REFERENCES auth.users(id);
ALTER TABLE public."mensagens_solicitacoes" ADD CONSTRAINT "mensagens_solicitacoes_solicitacao_id_fkey" FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes(id);
ALTER TABLE public."profissionais" ADD CONSTRAINT "profissionais_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."solicitacoes" ADD CONSTRAINT "solicitacoes_cliente_usuario_id_fkey" FOREIGN KEY (cliente_usuario_id) REFERENCES auth.users(id);
ALTER TABLE public."solicitacoes" ADD CONSTRAINT "solicitacoes_profissional_id_fkey" FOREIGN KEY (profissional_id) REFERENCES profissionais(id);
ALTER TABLE public."solicitacoes" ADD CONSTRAINT "solicitacoes_profissional_usuario_id_fkey" FOREIGN KEY (profissional_usuario_id) REFERENCES auth.users(id);
CREATE INDEX historico_solicitacao_idx ON public.historico_solicitacoes USING btree (solicitacao_id, criado_em);
CREATE INDEX historico_ator_idx ON public.historico_solicitacoes USING btree (ator_usuario_id);
CREATE INDEX solicitacoes_profissional_id_idx ON public.solicitacoes USING btree (profissional_id);
CREATE INDEX solicitacoes_profissional_idx ON public.solicitacoes USING btree (profissional_usuario_id, criado_em DESC);
CREATE INDEX mensagens_autor_idx ON public.mensagens_solicitacoes USING btree (autor_usuario_id);
CREATE INDEX mensagens_solicitacao_idx ON public.mensagens_solicitacoes USING btree (solicitacao_id, criado_em);
CREATE INDEX solicitacoes_cliente_idx ON public.solicitacoes USING btree (cliente_usuario_id, criado_em DESC);
CREATE OR REPLACE FUNCTION private.sincronizar_catalogo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
 INSERT INTO public.catalogo_profissionais(id,nome,cidade,servico,descricao,ativo)
 VALUES(NEW.id,NEW.nome,NEW.cidade,NEW.servico,NEW.descricao,NEW.publicado)
 ON CONFLICT(id) DO UPDATE SET nome=EXCLUDED.nome,cidade=EXCLUDED.cidade,servico=EXCLUDED.servico,descricao=EXCLUDED.descricao,ativo=EXCLUDED.ativo;
 RETURN NEW;
END $function$
;
REVOKE ALL ON FUNCTION private."sincronizar_catalogo"() FROM PUBLIC, anon, authenticated;
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
REVOKE ALL ON FUNCTION private."validar_solicitacao"() FROM PUBLIC, anon, authenticated;
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
REVOKE ALL ON FUNCTION private."registrar_solicitacao"() FROM PUBLIC, anon, authenticated;
CREATE POLICY "catalogo_leitura" ON public."catalogo_profissionais" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (ativo);
CREATE POLICY "Cliente cadastra seu perfil" ON public."clientes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((usuario_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "Cliente consulta seu perfil" ON public."clientes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((usuario_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "Cliente edita seu perfil" ON public."clientes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((usuario_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((usuario_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "historico_leitura" ON public."historico_solicitacoes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM solicitacoes s
  WHERE ((s.id = historico_solicitacoes.solicitacao_id) AND ((( SELECT auth.uid() AS uid) = s.cliente_usuario_id) OR (( SELECT auth.uid() AS uid) = s.profissional_usuario_id))))));
CREATE POLICY "mensagens_envio" ON public."mensagens_solicitacoes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((autor_usuario_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM solicitacoes s
  WHERE ((s.id = mensagens_solicitacoes.solicitacao_id) AND ((( SELECT auth.uid() AS uid) = s.cliente_usuario_id) OR (( SELECT auth.uid() AS uid) = s.profissional_usuario_id)) AND (s.status <> ALL (ARRAY['concluida'::text, 'cancelada'::text])))))));
CREATE POLICY "mensagens_leitura" ON public."mensagens_solicitacoes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM solicitacoes s
  WHERE ((s.id = mensagens_solicitacoes.solicitacao_id) AND ((( SELECT auth.uid() AS uid) = s.cliente_usuario_id) OR (( SELECT auth.uid() AS uid) = s.profissional_usuario_id))))));
CREATE POLICY "Perfis profissionais podem ser consultados" ON public."profissionais" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT auth.uid() AS uid) = usuario_id));
CREATE POLICY "Profissionais podem cadastrar seu perfil" ON public."profissionais" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT auth.uid() AS uid) = usuario_id));
CREATE POLICY "Profissionais podem editar seu perfil" ON public."profissionais" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT auth.uid() AS uid) = usuario_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = usuario_id));
CREATE POLICY "solicitacoes_criacao" ON public."solicitacoes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT auth.uid() AS uid) = cliente_usuario_id));
CREATE POLICY "solicitacoes_edicao" ON public."solicitacoes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((( SELECT auth.uid() AS uid) = cliente_usuario_id) OR (( SELECT auth.uid() AS uid) = profissional_usuario_id))) WITH CHECK (((( SELECT auth.uid() AS uid) = cliente_usuario_id) OR (( SELECT auth.uid() AS uid) = profissional_usuario_id)));
CREATE POLICY "solicitacoes_leitura" ON public."solicitacoes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((( SELECT auth.uid() AS uid) = cliente_usuario_id) OR (( SELECT auth.uid() AS uid) = profissional_usuario_id)));
CREATE TRIGGER sincronizar_catalogo AFTER INSERT OR UPDATE ON public.profissionais FOR EACH ROW EXECUTE FUNCTION private.sincronizar_catalogo();
CREATE TRIGGER registrar_solicitacao AFTER INSERT OR UPDATE ON public.solicitacoes FOR EACH ROW EXECUTE FUNCTION private.registrar_solicitacao();
CREATE TRIGGER validar_solicitacao BEFORE INSERT OR UPDATE ON public.solicitacoes FOR EACH ROW EXECUTE FUNCTION private.validar_solicitacao();
REVOKE ALL ON public."catalogo_profissionais" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON public."clientes" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON public."historico_solicitacoes" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON public."mensagens_solicitacoes" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON public."profissionais" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON public."solicitacoes" FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT ON public."catalogo_profissionais" TO "service_role";
GRANT SELECT ON public."catalogo_profissionais" TO "service_role";
GRANT UPDATE ON public."catalogo_profissionais" TO "service_role";
GRANT DELETE ON public."catalogo_profissionais" TO "service_role";
GRANT TRUNCATE ON public."catalogo_profissionais" TO "service_role";
GRANT REFERENCES ON public."catalogo_profissionais" TO "service_role";
GRANT TRIGGER ON public."catalogo_profissionais" TO "service_role";
GRANT SELECT ON public."catalogo_profissionais" TO "anon";
GRANT SELECT ON public."catalogo_profissionais" TO "authenticated";
GRANT INSERT ON public."clientes" TO "authenticated";
GRANT SELECT ON public."clientes" TO "authenticated";
GRANT UPDATE ON public."clientes" TO "authenticated";
GRANT INSERT ON public."clientes" TO "service_role";
GRANT SELECT ON public."clientes" TO "service_role";
GRANT UPDATE ON public."clientes" TO "service_role";
GRANT DELETE ON public."clientes" TO "service_role";
GRANT TRUNCATE ON public."clientes" TO "service_role";
GRANT REFERENCES ON public."clientes" TO "service_role";
GRANT TRIGGER ON public."clientes" TO "service_role";
GRANT INSERT ON public."historico_solicitacoes" TO "service_role";
GRANT SELECT ON public."historico_solicitacoes" TO "service_role";
GRANT UPDATE ON public."historico_solicitacoes" TO "service_role";
GRANT DELETE ON public."historico_solicitacoes" TO "service_role";
GRANT TRUNCATE ON public."historico_solicitacoes" TO "service_role";
GRANT REFERENCES ON public."historico_solicitacoes" TO "service_role";
GRANT TRIGGER ON public."historico_solicitacoes" TO "service_role";
GRANT SELECT ON public."historico_solicitacoes" TO "authenticated";
GRANT INSERT ON public."mensagens_solicitacoes" TO "service_role";
GRANT SELECT ON public."mensagens_solicitacoes" TO "service_role";
GRANT UPDATE ON public."mensagens_solicitacoes" TO "service_role";
GRANT DELETE ON public."mensagens_solicitacoes" TO "service_role";
GRANT TRUNCATE ON public."mensagens_solicitacoes" TO "service_role";
GRANT REFERENCES ON public."mensagens_solicitacoes" TO "service_role";
GRANT TRIGGER ON public."mensagens_solicitacoes" TO "service_role";
GRANT SELECT ON public."mensagens_solicitacoes" TO "authenticated";
GRANT INSERT ON public."profissionais" TO "authenticated";
GRANT SELECT ON public."profissionais" TO "authenticated";
GRANT UPDATE ON public."profissionais" TO "authenticated";
GRANT INSERT ON public."profissionais" TO "service_role";
GRANT SELECT ON public."profissionais" TO "service_role";
GRANT UPDATE ON public."profissionais" TO "service_role";
GRANT DELETE ON public."profissionais" TO "service_role";
GRANT TRUNCATE ON public."profissionais" TO "service_role";
GRANT REFERENCES ON public."profissionais" TO "service_role";
GRANT TRIGGER ON public."profissionais" TO "service_role";
GRANT INSERT ON public."solicitacoes" TO "service_role";
GRANT SELECT ON public."solicitacoes" TO "service_role";
GRANT UPDATE ON public."solicitacoes" TO "service_role";
GRANT DELETE ON public."solicitacoes" TO "service_role";
GRANT TRUNCATE ON public."solicitacoes" TO "service_role";
GRANT REFERENCES ON public."solicitacoes" TO "service_role";
GRANT TRIGGER ON public."solicitacoes" TO "service_role";
GRANT SELECT ON public."solicitacoes" TO "authenticated";
GRANT INSERT ("solicitacao_id") ON public."mensagens_solicitacoes" TO "authenticated";
GRANT INSERT ("texto") ON public."mensagens_solicitacoes" TO "authenticated";
GRANT INSERT ("cliente_usuario_id") ON public."solicitacoes" TO "authenticated";
GRANT INSERT ("profissional_id") ON public."solicitacoes" TO "authenticated";
GRANT INSERT ("titulo") ON public."solicitacoes" TO "authenticated";
GRANT INSERT ("descricao") ON public."solicitacoes" TO "authenticated";
GRANT UPDATE ("status") ON public."solicitacoes" TO "authenticated";
GRANT UPDATE ("valor_centavos") ON public."solicitacoes" TO "authenticated";
COMMIT;
