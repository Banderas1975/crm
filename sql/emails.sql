-- v9 · Emails de aviso. Correr UMA vez no SQL Editor do Supabase, depois do relatorios.sql.
-- Tudo ou nada: se algo falhar, nada fica a meio.

begin;

-- 1. Preferências de cada utilizador. Sem email de avisos, usa o email da conta.
alter table usuarios add column email_avisos text check (char_length(email_avisos) <= 200);
alter table usuarios add column aviso_tarefas boolean not null default true;
alter table usuarios add column aviso_reuniao_antes boolean not null default true;
alter table usuarios add column aviso_reuniao_alterada boolean not null default true;

-- 2. Quando uma reunião foi marcada ou mudou de hora. O banco grava-o sozinho.
--    As reuniões que já existem ficam sem data: não geram um email de "marcada" ao ligar isto.
alter table reunioes add column alterada_em timestamptz;

create function reunioes_marcar_alteracao() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.inicio is distinct from old.inicio then
    new.alterada_em := now();
  end if;
  return new;
end $$;

create trigger reunioes_marcar_alteracao
  before insert or update of inicio on reunioes
  for each row execute function reunioes_marcar_alteracao();

-- 3. Registo de cada email. A "chave" é única: diz que aviso é, para quem e de
--    quando. Antes de enviar, o CRM tenta gravar a chave; se ela já existir, o
--    email já saiu (ou está a sair) e não volta a sair. É isto que impede duplicados,
--    mesmo que o envio corra duas vezes ao mesmo tempo.
create table emails_enviados (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references usuarios (id) on delete cascade,
  chave text not null unique,
  tipo text not null check (tipo in ('tarefas', 'reuniao_antes', 'reuniao_alterada', 'teste')),
  para text not null,
  assunto text not null,
  estado text not null default 'pendente' check (estado in ('pendente', 'enviado', 'falhou')),
  tentativas integer not null default 1,
  erro text,
  criado_em timestamptz not null default now(),
  enviado_em timestamptz
);

create index emails_enviados_usuario on emails_enviados (usuario_id, criado_em desc);

-- RLS ligado e sem políticas: só o servidor do CRM, com a chave secreta, lê e grava.
alter table emails_enviados enable row level security;

commit;
