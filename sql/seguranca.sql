-- v11 · Proteção de linhas (RLS) em todas as tabelas. Correr UMA vez no SQL
-- Editor do Supabase. Pode correr-se outra vez sem problema.
--
-- Porquê: com o RLS desligado, a chave pública do Supabase (a "anon", que não
-- é secreta por natureza) consegue ler e escrever a tabela pela API — incluindo
-- os hashes das senhas em "usuarios". Com o RLS ligado e sem políticas, essa
-- chave não vê nem mexe em nada. O CRM não é afetado: usa a chave secreta, que
-- passa por cima do RLS, e só no servidor.

do $$
declare
  t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  loop
    execute format('alter table public.%I enable row level security', t.relname);
  end loop;
end $$;

-- Confirmação: tabelas do CRM ainda sem RLS. Tem de vir vazio.
select c.relname as tabela_sem_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity;
