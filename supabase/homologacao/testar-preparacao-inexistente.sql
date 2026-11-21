-- TrampoFacil-Homologacao: rejeitar preparação inexistente.
-- Execute apenas no banco de homologação; transação revertida.
begin;
set local role service_role;
do $$
declare
  v_bloqueado boolean := false;
begin
  begin
    perform private.registrar_tentativa_inerte(
      '11111111-1111-4111-8111-111111111111'::uuid,
      '22222222-2222-4222-8222-222222222222'::uuid
    );
  exception when others then
    v_bloqueado := true;
  end;
  if not v_bloqueado then
    raise exception 'FALHA: preparação inexistente aceita';
  end if;
end;
$$;
rollback;
