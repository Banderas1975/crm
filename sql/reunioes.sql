-- v5 · Calendário, reuniões e travão no login. Correr uma vez no SQL Editor do Supabase.

-- Uma reunião pertence sempre a um contato (o principal) e some com ele.
-- O início é um instante (timestamptz); o CRM mostra-o sempre em Europe/Lisbon.
create table reunioes (
  id bigint generated always as identity primary key,
  contato_id bigint not null,
  titulo text not null check (char_length(titulo) between 1 and 200),
  inicio timestamptz not null,
  duracao_min integer not null check (duracao_min between 5 and 720),
  local text check (char_length(local) <= 200),
  criado_em timestamptz not null default now(),
  -- Nome fixo: o CRM usa-o para distinguir este contato dos participantes.
  constraint reunioes_contato_fk foreign key (contato_id) references contatos (id) on delete cascade
);

create index reunioes_inicio on reunioes (inicio);
create index reunioes_contato_id on reunioes (contato_id);

-- Outros contatos que também participam.
create table reuniao_contatos (
  reuniao_id bigint not null references reunioes (id) on delete cascade,
  contato_id bigint not null references contatos (id) on delete cascade,
  primary key (reuniao_id, contato_id)
);

create index reuniao_contatos_contato_id on reuniao_contatos (contato_id);

-- Utilizadores do CRM que participam.
create table reuniao_usuarios (
  reuniao_id bigint not null references reunioes (id) on delete cascade,
  usuario_id bigint not null references usuarios (id) on delete cascade,
  primary key (reuniao_id, usuario_id)
);

-- Travão contra quem tenta adivinhar senhas: falhas seguidas por email.
create table tentativas_login (
  email text primary key check (char_length(email) <= 200),
  falhas integer not null default 0,
  bloqueado_ate timestamptz
);

-- RLS ligado e sem políticas: só o servidor do CRM, com a chave secreta, lê e grava.
alter table reunioes enable row level security;
alter table reuniao_contatos enable row level security;
alter table reuniao_usuarios enable row level security;
alter table tentativas_login enable row level security;
