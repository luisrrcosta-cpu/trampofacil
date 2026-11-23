-- Homologação: normalização de busca, sem alterar dados, RLS ou permissões.
create or replace function public.buscar_profissionais(
  termo_servico text default '', termo_cidade text default '', pagina integer default 0
) returns table(id uuid,nome text,cidade text,servico text,descricao text)
language sql stable security invoker set search_path='' as $$
  select c.id,c.nome,c.cidade,c.servico,c.descricao
  from public.catalogo_profissionais c
  where c.ativo
    and pg_catalog.strpos(pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.translate(pg_catalog.lower(pg_catalog.normalize(c.servico, 'NFC')), 'áàâãäéèêëíìîïóòôõöúùûüç ', 'aaaaaeeeeiiiiooooouuuuc '), '[[:space:]]+', ' ', 'g')), pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.translate(pg_catalog.lower(pg_catalog.normalize(pg_catalog.left(pg_catalog.btrim(termo_servico),120), 'NFC')), 'áàâãäéèêëíìîïóòôõöúùûüç ', 'aaaaaeeeeiiiiooooouuuuc '), '[[:space:]]+', ' ', 'g'))) > 0
    and pg_catalog.strpos(pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.translate(pg_catalog.lower(pg_catalog.normalize(c.cidade, 'NFC')), 'áàâãäéèêëíìîïóòôõöúùûüç ', 'aaaaaeeeeiiiiooooouuuuc '), '[[:space:]]+', ' ', 'g')), pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.translate(pg_catalog.lower(pg_catalog.normalize(pg_catalog.left(pg_catalog.btrim(termo_cidade),120), 'NFC')), 'áàâãäéèêëíìîïóòôõöúùûüç ', 'aaaaaeeeeiiiiooooouuuuc '), '[[:space:]]+', ' ', 'g'))) > 0
  order by pg_catalog.lower(c.nome),c.id
  limit 20 offset greatest(pagina,0)::bigint * 20
$$;
-- Retorna somente os mesmos cinco campos públicos; telefone/CPF/CNPJ não são lidos.
-- NFC normaliza acentos compostos/decompostos. % e _ permanecem texto literal.
