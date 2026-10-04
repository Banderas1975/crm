-- v14 · Landing page: os pedidos de experiência de 14 dias. Correr UMA vez no
-- SQL Editor do Supabase, depois do recuperar-senha.sql. Tudo ou nada.

begin;

create table leads (
  id bigint generated always as identity primary key,
  nome text not null check (char_length(nome) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200),
  telefone text check (char_length(telefone) <= 40),
  empresa text not null check (char_length(empresa) between 1 and 120),
  utilizadores int not null check (utilizadores between 1 and 1000),
  mensagem text check (char_length(mensagem) <= 1000),
  -- Quando a pessoa marcou a caixa do consentimento (RGPD).
  consentimento_em timestamptz not null,
  criado_em timestamptz not null default now()
);

create index leads_email on leads (email, criado_em desc);

alter table leads enable row level security;

-- O registo de emails passa a aceitar o aviso de lead novo.
alter table emails_enviados drop constraint emails_enviados_tipo_check;
alter table emails_enviados add constraint emails_enviados_tipo_check
  check (tipo in ('tarefas', 'tarefa_antes', 'reuniao_antes', 'reuniao_alterada', 'teste', 'recuperar', 'lead'));

commit;
