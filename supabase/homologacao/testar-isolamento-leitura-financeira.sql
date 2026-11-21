-- Homologação: garantir que clientes não leiam registros financeiros privados.
-- Auditoria somente leitura, sem alteração de políticas.
do $$
declare v_tabela text;
begin
 foreach v_tabela in array array[
   'private.preparacoes_pagamento',
   'private.tentativas_pagamento_teste',
   'private.eventos_tentativa_pagamento_teste'
 ] loop
   if has_table_privilege('anon',v_tabela,'SELECT')
      or has_table_privilege('authenticated',v_tabela,'SELECT') then
     raise exception 'FALHA: leitura financeira indevida em %',v_tabela;
   end if;
 end loop;
end $$;
