-- v14.2 · No formulário da landing page a empresa passa a ser opcional.
-- Correr UMA vez no SQL Editor do Supabase, depois do leads.sql.

alter table leads alter column empresa drop not null;
