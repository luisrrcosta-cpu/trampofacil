-- Teste de autorização real no TrampoFacil-Homologacao.
-- A role authenticated deve receber SQLSTATE 42501, não um erro genérico.
begin;
set local role authenticated;
do $$
declare
  v_estado text;
  v_mensagem text;
begin
  begin
    perform private.registrar_tentativa_inerte(
      '11111111-1111-4111-8111-111111111111'::uuid,
      '22222222-2222-4222-8222-222222222222'::uuid
    );
    raise exception 'TESTE_FALHOU: usuário executou função privada';
  exception when others then
    get stacked diagnostics v_estado=returned_sqlstate, v_mensagem=message_text;
    if v_estado <> '42501' then
      raise exception 'FALHA: estado inesperado %, mensagem %', v_estado, v_mensagem;
    end if;
  end;
end;
$$;
rollback;
