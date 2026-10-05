-- v16 · Contadores contra abusos (login e formulário da landing page), por
-- email e por IP. O IP nunca fica guardado: só um hash dele.
-- Correr UMA vez no SQL Editor do Supabase.

begin;

create table limites (
  chave text primary key check (char_length(chave) <= 300),
  contagem integer not null default 0,
  inicio timestamptz not null default now(),
  bloqueado_ate timestamptz
);

-- RLS ligado e sem políticas: só o servidor do CRM, com a chave secreta, lê e grava.
alter table limites enable row level security;

-- A tabela antiga do travão de login (tentativas_login) deixa de ser usada.
-- Fica onde está: apagá-la antes de o código novo estar na VPS partia o login.

commit;
