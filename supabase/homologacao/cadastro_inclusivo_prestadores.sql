-- Exclusivo de TrampoFacil-Homologacao; classificação declarada, sem documentos.
-- Campos opcionais no banco preservam os perfis legados.
alter table public.profissionais
  add column tipo_prestador text,
  add column tipo_atividade text,
  add constraint profissionais_tipo_prestador_check
    check (tipo_prestador in ('pessoa_fisica', 'mei', 'empresa')),
  add constraint profissionais_tipo_atividade_check
    check (tipo_atividade in ('regular', 'ocasional'));
comment on column public.profissionais.tipo_prestador is
  'Classificação autodeclarada. Não é verificação de CPF/CNPJ nem autorização fiscal.';
comment on column public.profissionais.tipo_atividade is
  'Frequência autodeclarada: regular ou ocasional; não é categoria tributária.';
grant select (tipo_prestador, tipo_atividade),
  insert (tipo_prestador, tipo_atividade),
  update (tipo_prestador, tipo_atividade)
  on public.profissionais to authenticated;
-- Nenhuma política RLS, publicação de catálogo ou dado existente é alterado.
