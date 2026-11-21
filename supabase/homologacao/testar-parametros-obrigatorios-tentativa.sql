-- TrampoFacil-Homologacao: validação estrita dos dois parâmetros obrigatórios.
-- Uma falha genérica de permissão não é considerada sucesso.
-- Executar exclusivamente no banco de homologação.
begin;
set local role service_role;
do $$
declare
  v_mensagem text;
begin
  begin
    perform private.registrar_tentativa_inerte(
      null::uuid,
      '22222222-2222-4222-8222-222222222222'::uuid
    );
    raise exception 'TESTE_FALHOU: preparação nula aceita';
  exception when others then
    get stacked diagnostics v_mensagem=message_text;
    if v_mensagem <> 'Tentativa inválida' then
      raise exception 'FALHA: rejeição inesperada (%).',v_mensagem;
    end if;
  end;
  begin
    perform private.registrar_tentativa_inerte(
      '11111111-1111-4111-8111-111111111111'::uuid,
      null::uuid
    );
    raise exception 'TESTE_FALHOU: chave de idempotência nula aceita';
  exception when others then
    get stacked diagnostics v_mensagem=message_text;
    if v_mensagem <> 'Tentativa inválida' then
      raise exception 'FALHA: rejeição inesperada (%).',v_mensagem;
    end if;
  end;
end;
$$;
rollback;
