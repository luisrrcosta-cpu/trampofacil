-- Teste negativo estrito: rejeição deve vir da validação de negócio.
-- Um erro genérico de permissão NÃO representa aprovação do teste.
-- Executar somente na homologação; nenhuma escrita é persistida.
begin;
set local role service_role;
do $$
declare
  v_mensagem text;
  v_estado text;
begin
  begin
    perform private.registrar_tentativa_inerte(
      '11111111-1111-4111-8111-111111111111'::uuid,
      '22222222-2222-4222-8222-222222222222'::uuid
    );
    raise exception 'FALHA_TESTE: preparação inexistente foi aceita';
  exception when others then
    get stacked diagnostics v_mensagem = message_text, v_estado = returned_sqlstate;
    if v_mensagem <> 'Preparação indisponível' then
      raise exception 'FALHA_TESTE: erro inesperado (SQLSTATE %, mensagem %)',v_estado,v_mensagem;
    end if;
  end;
end;
$$;
rollback;
