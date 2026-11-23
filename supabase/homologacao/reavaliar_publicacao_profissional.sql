-- Homologação: alterações materiais de perfil publicado exigem nova análise.
create function private.reavaliar_publicacao_profissional()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if old.publicado and row(new.nome,new.cidade,new.servico,new.descricao,new.tipo_prestador,new.tipo_atividade)
      is distinct from row(old.nome,old.cidade,old.servico,old.descricao,old.tipo_prestador,old.tipo_atividade) then
    new.publicado := false;
  end if;
  return new;
end;
$$;
revoke all on function private.reavaliar_publicacao_profissional() from public,anon,authenticated,service_role;
create trigger reavaliar_publicacao
  before update on public.profissionais
  for each row execute function private.reavaliar_publicacao_profissional();
comment on function private.reavaliar_publicacao_profissional() is
  'Retira publicação após mudança de nome, cidade, serviço, descrição ou modalidades; não publica perfis nem altera telefone.';
-- O trigger AFTER existente sincronizar_catalogo propaga publicado=false ao catálogo.
-- Nenhum perfil é modificado pela instalação; efeito apenas em futuras edições materiais.
