-- Candidato isolado. Executar após versoes_rascunho_contrato.sql somente em testes.
-- Sem textos aprovados/seeds, RPC pública ou ativação em ambiente hospedado.
begin;
create table private.minutas_rascunho_contrato (
 versao text primary key check(versao ~ '^[a-z0-9][a-z0-9._-]{0,63}$'),
 texto_integral text not null check(octet_length(texto_integral) between 10 and 65536 and char_length(btrim(texto_integral))>=10),
 hash_sha256 text not null check(hash_sha256 ~ '^[0-9a-f]{64}$'),
 criado_em timestamptz not null default clock_timestamp(),
 unique(versao,hash_sha256)
);
create function private.registrar_minuta_rascunho() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 new.hash_sha256:=encode(sha256(convert_to(new.texto_integral,'UTF8')),'hex');
 new.criado_em:=clock_timestamp();
 return new;
end;$$;
create trigger registrar_minuta_rascunho before insert on private.minutas_rascunho_contrato
 for each row execute function private.registrar_minuta_rascunho();
revoke all on function private.registrar_minuta_rascunho() from public,anon,authenticated,service_role;
alter table private.minutas_rascunho_contrato enable row level security;
revoke all on private.minutas_rascunho_contrato from public,anon,authenticated,service_role;
create trigger preservar_minuta_rascunho before update or delete on private.minutas_rascunho_contrato
 for each row execute function private.impedir_alteracao_rascunho();

-- Sem backfill: versões preexistentes exigem tratamento explícito antes da migração.
alter table private.versoes_rascunho_contrato
 add column minuta_versao text not null,
 add column minuta_hash_sha256 text not null,
 add foreign key(minuta_versao,minuta_hash_sha256)
 references private.minutas_rascunho_contrato(versao,hash_sha256);

create function private.vincular_minuta_rascunho() returns trigger
language plpgsql security invoker set search_path='' as $$
declare minuta private.minutas_rascunho_contrato%rowtype;
begin
 -- A origem é o registro privado mantido pelo responsável pela implantação.
 -- Nunca aceitar texto/hash fornecido por participante como minuta confiável.
 select * into minuta from private.minutas_rascunho_contrato
 where versao=new.snapshot->>'versao_minuta';
 if not found then raise exception 'Minuta não registrada' using errcode='22023';end if;
 new.minuta_versao:=minuta.versao;
 new.minuta_hash_sha256:=minuta.hash_sha256;
 return new;
end;$$;
create trigger aaa_vincular_minuta_rascunho before insert on private.versoes_rascunho_contrato
 for each row execute function private.vincular_minuta_rascunho();
revoke all on function private.vincular_minuta_rascunho() from public,anon,authenticated,service_role;
commit;
