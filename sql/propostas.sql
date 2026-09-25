-- v4 · Propostas. Correr uma vez no SQL Editor do Supabase.

-- Uma linha por proposta. Nunca se substitui nem se apaga pela app:
-- cada envio é uma linha nova.
create table propostas (
  id bigint generated always as identity primary key,
  contato_id bigint not null references contatos (id) on delete cascade,
  nome text not null,                 -- nome original, só para mostrar
  caminho text not null unique,       -- <contato_id>/<código aleatório>.<pdf|docx|xlsx>
  tamanho integer not null check (tamanho > 0 and tamanho <= 4718592),
  valor numeric(12, 2) not null check (valor > 0),
  criado_em timestamptz not null default now()
);

create index propostas_contato_id on propostas (contato_id);

-- RLS ligado e sem políticas: a chave pública não lê nem escreve nada aqui.
-- Só o servidor do CRM, com a chave secreta, chega a esta tabela.
alter table propostas enable row level security;

-- A proposta com que o negócio foi ganho.
alter table contatos
  add column proposta_ganha_id bigint references propostas (id) on delete set null;

-- Bucket privado: sem link público. 4,5 MB e só os três tipos aceites.
-- Sem políticas em storage.objects: só a chave secreta lê e grava.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'propostas',
  'propostas',
  false,
  4718592,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
);
