-- Preparação isolada: revisar e testar antes de aplicar em homologação.
-- Não habilita edição, publicação ou busca de especialidades.
begin;
create table private.especialidades_profissionais (
  profissional_id uuid not null references public.profissionais(id),
  posicao smallint not null check (posicao between 1 and 10),
  especialidade text not null check (
    char_length(btrim(especialidade)) between 2 and 120
    and especialidade = btrim(especialidade)
    and especialidade !~ '[[:cntrl:]]'
  ),
  primary key (profissional_id, posicao)
);
create unique index especialidades_profissionais_nome_unico
on private.especialidades_profissionais (profissional_id, lower(especialidade));
alter table private.especialidades_profissionais enable row level security;
revoke all on private.especialidades_profissionais from public, anon, authenticated;
-- Sem políticas de acesso até implementar fluxo transacional de revisão.
-- Não altera tabelas existentes, triggers, registros ou permissões existentes.
commit;
