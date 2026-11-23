-- Homologação: validação de conteúdo, sem alteração de registros ou permissões.
-- Nomes dos campos e limites acompanham o formulário; não verificam identidade.
alter table public.clientes
  add constraint clientes_nome_conteudo_check check (nome is not null and length(btrim(nome)) between 2 and 120 and nome !~ '[[:cntrl:]]') not valid,
  add constraint clientes_cidade_conteudo_check check (cidade is not null and length(btrim(cidade)) between 2 and 120 and cidade !~ '[[:cntrl:]]') not valid,
  add constraint clientes_telefone_conteudo_check check (telefone is not null and telefone ~ '^\+?[0-9]{10,15}$') not valid,
  add constraint clientes_email_conteudo_check check (email is not null and length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') not valid;
alter table public.clientes validate constraint clientes_nome_conteudo_check;
alter table public.clientes validate constraint clientes_cidade_conteudo_check;
alter table public.clientes validate constraint clientes_telefone_conteudo_check;
alter table public.clientes validate constraint clientes_email_conteudo_check;
alter table public.profissionais
  add constraint profissionais_nome_conteudo_check check (nome is not null and length(btrim(nome)) between 2 and 120 and nome !~ '[[:cntrl:]]') not valid,
  add constraint profissionais_cidade_conteudo_check check (cidade is not null and length(btrim(cidade)) between 2 and 120 and cidade !~ '[[:cntrl:]]') not valid,
  add constraint profissionais_telefone_conteudo_check check (telefone is not null and telefone ~ '^\+?[0-9]{10,15}$') not valid,
  add constraint profissionais_servico_conteudo_check check (servico is not null and length(btrim(servico)) between 2 and 120 and servico !~ '[[:cntrl:]]') not valid,
  add constraint profissionais_descricao_conteudo_check check (descricao is null or length(descricao) <= 1000) not valid;
alter table public.profissionais validate constraint profissionais_nome_conteudo_check;
alter table public.profissionais validate constraint profissionais_cidade_conteudo_check;
alter table public.profissionais validate constraint profissionais_telefone_conteudo_check;
alter table public.profissionais validate constraint profissionais_servico_conteudo_check;
alter table public.profissionais validate constraint profissionais_descricao_conteudo_check;
