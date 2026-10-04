-- v15 · Backend: a configuração SMTP de cada utilizador. Correr UMA vez no SQL
-- Editor do Supabase, depois do leads.sql. Tudo ou nada.

begin;

-- Uma linha por utilizador. A password SMTP fica cifrada com a SMTP_CHAVE do
-- .env da VPS: quem lesse esta tabela só via texto ilegível.
create table smtp_utilizadores (
  usuario_id bigint primary key references usuarios (id) on delete cascade,
  servidor text not null check (char_length(servidor) between 1 and 200),
  porta int not null check (porta in (25, 465, 587, 2525)),
  utilizador text not null check (char_length(utilizador) between 1 and 200),
  senha_cifrada text not null,
  remetente_nome text check (char_length(remetente_nome) <= 120),
  remetente_email text not null check (char_length(remetente_email) between 3 and 200),
  atualizado_em timestamptz not null default now(),
  -- O último "Enviar email de teste": quando, se correu bem e, se não, porquê.
  testado_em timestamptz,
  teste_ok boolean,
  teste_erro text
);

alter table smtp_utilizadores enable row level security;

commit;

notify pgrst, 'reload schema';
