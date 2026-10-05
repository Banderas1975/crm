-- v16 · Nome e telefone de quem cria conta. Correr UMA vez no SQL Editor do
-- Supabase. As contas que já existem ficam sem nome e sem telefone (null);
-- o formulário de registo é que os torna obrigatórios para as contas novas.

alter table usuarios add column nome text check (char_length(nome) between 1 and 120);
alter table usuarios add column telefone text check (char_length(telefone) <= 20);
