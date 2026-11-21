-- Teste de autorização efetiva no TrampoFacil-Homologacao.
-- Ambos os papéis públicos devem receber SQLSTATE 42501.
-- Sem gravação persistente.
begin;
set local role authenticated;
do $$
declare v_estado text; v_mensagem text;
begin
  begin
    perform private.registrar_tentativa_inerte(
      '11111111-1111-4111-8111-111111111111'::uuid,
      '22222222-2222-4222-8222-222222222222'::uuid
    );
    raise exception 'TESTE_FALHOU: authenticated executou função privada';
  exception when others then
    get stacked diagnostics v_estado=returned_sqlstate, v_mensagem=message_text;
    if v_estado <> '42501' then
      raise exception 'FALHA authenticated: %, %', v_estado, v_mensagem;
    end if;
  end;
end $$;
reset role;
set local role anon;
do $$
declare v_estado text; v_mensagem text;
begin
  begin
    perform private.registrar_tentativa_inerte(
      '11111111-1111-4111-8111-111111111111'::uuid,
      '22222222-2222-4222-8222-222222222222'::uuid
    );
    raise exception 'TESTE_FALHOU: anon executou função privada';
  exception when others then
    get stacked diagnostics v_estado=returned_sqlstate, v_mensagem=message_text;
    if v_estado <> '42501' then
      raise exception 'FALHA anon: %, %', v_estado, v_mensagem;
    end if;
  end;
end $$;
rollback;
