-- v16 · O formulário da landing page deixa de perguntar quantos utilizadores.
-- Correr UMA vez no SQL Editor do Supabase. Os pedidos antigos mantêm o número.

alter table leads alter column utilizadores drop not null;
