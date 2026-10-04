-- v12 · Recuperar a password a partir do login. Correr UMA vez no SQL Editor do
-- Supabase, depois do seguranca.sql. Tudo ou nada.

begin;

-- Quando a senha mudou pela última vez. Sessões abertas antes disso deixam de valer.
alter table usuarios add column senha_alterada_em timestamptz;

-- Pedidos de recuperação. Do link só se guarda o hash: quem lesse esta tabela
-- não conseguia usar nenhum link. Cada link vale 1 hora e uma única vez.
create table recuperacoes_senha (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references usuarios (id) on delete cascade,
  token_hash text not null unique,
  expira_em timestamptz not null,
  usado_em timestamptz,
  criado_em timestamptz not null default now()
);

create index recuperacoes_senha_usuario on recuperacoes_senha (usuario_id, criado_em desc);

alter table recuperacoes_senha enable row level security;

-- O registo de emails passa a aceitar o email de recuperação.
alter table emails_enviados drop constraint emails_enviados_tipo_check;
alter table emails_enviados add constraint emails_enviados_tipo_check
  check (tipo in ('tarefas', 'tarefa_antes', 'reuniao_antes', 'reuniao_alterada', 'teste', 'recuperar'));

commit;
