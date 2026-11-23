-- Relatório administrativo somente de leitura. Executar apenas na homologação.
-- Não expor esta consulta como RPC pública nem copiar credenciais administrativas para o navegador.
select a.usuario_id, a.criado_em as solicitado_em,
       p.nome, p.cidade, p.servico, p.tipo_prestador, p.tipo_atividade,
       case when p.tipo_prestador is null or p.tipo_atividade is null
            then 'cadastro_incompleto' else 'aguardando_revisao' end as situacao_revisao
from public.solicitacoes_analise_profissional a
join public.profissionais p on p.usuario_id = a.usuario_id
where a.estado = 'aguardando_analise' and not p.publicado
order by a.criado_em asc, a.usuario_id asc;
