-- Teste estrito no TrampoFacil-Homologacao. Qualquer erro diferente do
-- esperado, inclusive erro de permissão, reprova o teste.
begin;
set local role service_role;
do $$
declare v_mensagem text;
begin
  begin
    perform private.registrar_tentativa_inerte(null::uuid, null::uuid);
    raise exception 'TESTE_FALHOU: parâmetros nulos aceitos';
  exception when others then
    get stacked diagnostics v_mensagem = message_text;
    if v_mensagem <> 'Tentativa inválida' then
      raise exception 'FALHA: resposta inesperada: %', v_mensagem;
    end if;
  end;
end;
$$;
rollback;
