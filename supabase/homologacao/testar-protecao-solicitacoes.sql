-- Homologação: auditoria somente leitura da proteção das solicitações.
-- Verifica presença de RLS, privilégios por coluna e validação por trigger.
do $$
declare v_def text;
begin
 if not (select relrowsecurity from pg_class where oid='public.solicitacoes'::regclass) then
   raise exception 'FALHA: RLS desativado em solicitacoes';
 end if;
 if has_table_privilege('authenticated','public.solicitacoes','UPDATE') then
   raise exception 'FALHA: UPDATE irrestrito concedido a authenticated';
 end if;
 if has_column_privilege('authenticated','public.solicitacoes','cliente_usuario_id','UPDATE')
   or has_column_privilege('authenticated','public.solicitacoes','profissional_usuario_id','UPDATE')
   or has_column_privilege('authenticated','public.solicitacoes','profissional_id','UPDATE') then
   raise exception 'FALHA: identidade da contratação pode ser editada';
 end if;
 if not exists(select 1 from pg_trigger where tgrelid='public.solicitacoes'::regclass
    and tgname='validar_solicitacao' and tgenabled='O' and not tgisinternal) then
   raise exception 'FALHA: gatilho de validação ausente ou desativado';
 end if;
 v_def:=pg_get_functiondef('private.validar_solicitacao()'::regprocedure);
 if position('Os dados originais da solicitação não podem ser alterados.' in v_def)=0
    or position('Alteração não permitida ao cliente.' in v_def)=0
    or position('Alteração não permitida ao profissional.' in v_def)=0 then
   raise exception 'FALHA: validação de estados ou identidade alterada';
 end if;
end $$;
