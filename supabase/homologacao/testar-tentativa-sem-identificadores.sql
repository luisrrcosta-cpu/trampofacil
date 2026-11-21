-- TrampoFacil-Homologacao: teste negativo transacional.
-- Não cria tentativas e não altera produção.
begin;
set local role service_role;
do $$
declare
  v_bloqueado boolean := false;
begin
  begin
    perform private.registrar_tentativa_inerte(null::uuid, null::uuid);
  exception when others then
    v_bloqueado := true;
  end;
  if not v_bloqueado then
    raise exception 'FALHA: tentativa sem identificadores foi aceita';
  end if;
end;
$$;
rollback;
