-- v8 · Relatórios. Correr UMA vez no SQL Editor do Supabase, depois do donos.sql.
-- Tudo ou nada: se algo falhar, nada fica a meio.

begin;

-- 1. A etapa "perdido". Se a etapa tiver uma regra (check) a limitar os valores,
--    é trocada por uma nova com as cinco etapas; se for um tipo enum, ganha o valor.
do $$
declare
  r record;
  tipo text;
begin
  select t.typname into tipo
  from pg_attribute a join pg_type t on t.oid = a.atttypid
  where a.attrelid = 'contatos'::regclass and a.attname = 'etapa' and t.typtype = 'e';

  if tipo is not null then
    execute format('alter type %I add value if not exists %L', tipo, 'perdido');
  else
    for r in
      select conname from pg_constraint
      where conrelid = 'contatos'::regclass and contype = 'c'
        and pg_get_constraintdef(oid) ilike '%etapa%'
    loop
      execute format('alter table contatos drop constraint %I', r.conname);
    end loop;
    alter table contatos add constraint contatos_etapa
      check (etapa in ('novo', 'em contato', 'proposta', 'cliente', 'perdido'));
  end if;
end $$;

-- 2. Campos novos do contato. As listas são fechadas: o banco recusa o resto.
alter table contatos add column origem text check (origem in
  ('Site', 'Indicação', 'LinkedIn', 'Redes sociais', 'Evento', 'Prospeção ativa', 'Outro'));
alter table contatos add column fecho_previsto date;
alter table contatos add column motivo_perda text check (motivo_perda in
  ('Preço', 'Escolheu concorrente', 'Sem orçamento', 'Sem resposta', 'Adiado', 'Não era o perfil', 'Outro'));
alter table contatos add column ganho_em timestamptz;
alter table contatos add column perdido_em timestamptz;

-- Perdido sem motivo não existe.
alter table contatos add constraint contatos_perdido_com_motivo
  check (etapa::text <> 'perdido' or motivo_perda is not null);

-- 3. Histórico de etapas: uma linha cada vez que um contato entra numa etapa.
create table etapa_historico (
  id bigint generated always as identity primary key,
  contato_id bigint not null,
  dono_id bigint not null,
  etapa text not null,
  entrou_em timestamptz not null default now(),
  constraint etapa_historico_contato_dono
    foreign key (contato_id, dono_id) references contatos (id, dono_id) on delete cascade
);

create index etapa_historico_contato on etapa_historico (contato_id, entrou_em);
create index etapa_historico_dono on etapa_historico (dono_id);

-- Os contatos de hoje entram no histórico na etapa em que estão, a contar de agora:
-- o tempo que já lá estavam não ficou registado em lado nenhum.
insert into etapa_historico (contato_id, dono_id, etapa)
select id, dono_id, etapa::text from contatos;

-- 4. Regras que o banco corre sozinho a cada mudança de etapa, venha ela de onde vier.
--    Antes de gravar: datas de ganho e de perda, e o motivo só fica se perdido.
create function contatos_antes_de_mudar_etapa() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.etapa is distinct from old.etapa then
    new.ganho_em := case when new.etapa::text = 'cliente' then now() end;
    new.perdido_em := case when new.etapa::text = 'perdido' then now() end;
  end if;
  if new.etapa::text <> 'perdido' then
    new.motivo_perda := null;
  end if;
  return new;
end $$;

create trigger contatos_antes_de_mudar_etapa
  before insert or update of etapa, motivo_perda on contatos
  for each row execute function contatos_antes_de_mudar_etapa();

--    Depois de gravar: a entrada no histórico.
create function contatos_depois_de_mudar_etapa() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.etapa is distinct from old.etapa then
    insert into etapa_historico (contato_id, dono_id, etapa) values (new.id, new.dono_id, new.etapa::text);
  end if;
  return null;
end $$;

create trigger contatos_depois_de_mudar_etapa
  after insert or update of etapa on contatos
  for each row execute function contatos_depois_de_mudar_etapa();

-- 5. Metas de receita: uma por mês e por utilizador.
create table metas (
  id bigint generated always as identity primary key,
  dono_id bigint not null references usuarios (id) on delete cascade,
  mes date not null check (extract(day from mes) = 1),
  valor numeric(12, 2) not null check (valor > 0),
  unique (dono_id, mes)
);

-- RLS ligado e sem políticas: só o servidor do CRM, com a chave secreta, lê e grava.
alter table etapa_historico enable row level security;
alter table metas enable row level security;

commit;
