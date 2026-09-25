-- v6 · Cada utilizador só vê o que é seu. Correr UMA vez no SQL Editor do Supabase,
-- de uma só vez (tudo ou nada: se algo falhar, nada fica a meio).
--
-- Os contatos que já existem passam a ser do administrador principal: o admin
-- aprovado mais antigo. Confirme no fim, com a consulta da última linha.

begin;

-- 1. Cada contato tem um dono. Uma conta com contatos não pode ser apagada
--    (on delete restrict): os dados de ninguém desaparecem por um clique.
alter table contatos add column dono_id bigint references usuarios (id) on delete restrict;

update contatos set dono_id = (
  select id from usuarios where papel = 'admin' and estado = 'aprovado' order by id limit 1
);

alter table contatos alter column dono_id set not null;
create index contatos_dono_id on contatos (dono_id);

-- O par (contato, dono) passa a poder ser referido pelas outras tabelas.
alter table contatos add constraint contatos_id_dono unique (id, dono_id);

-- 2. Tudo o que pende de um contato leva o mesmo dono. A chave composta faz o
--    banco recusar qualquer linha cujo dono não seja o dono do contato: mesmo um
--    erro no código não consegue ligar dados de um utilizador aos de outro.
alter table anotacoes add column dono_id bigint;
update anotacoes t set dono_id = c.dono_id from contatos c where c.id = t.contato_id;
alter table anotacoes alter column dono_id set not null;
alter table anotacoes add constraint anotacoes_contato_dono
  foreign key (contato_id, dono_id) references contatos (id, dono_id) on delete cascade;
create index anotacoes_dono_id on anotacoes (dono_id);

alter table follow_ups add column dono_id bigint;
update follow_ups t set dono_id = c.dono_id from contatos c where c.id = t.contato_id;
alter table follow_ups alter column dono_id set not null;
alter table follow_ups add constraint follow_ups_contato_dono
  foreign key (contato_id, dono_id) references contatos (id, dono_id) on delete cascade;
create index follow_ups_dono_id on follow_ups (dono_id);

alter table tarefas add column dono_id bigint;
update tarefas t set dono_id = c.dono_id from contatos c where c.id = t.contato_id;
alter table tarefas alter column dono_id set not null;
alter table tarefas add constraint tarefas_contato_dono
  foreign key (contato_id, dono_id) references contatos (id, dono_id) on delete cascade;
create index tarefas_dono_id on tarefas (dono_id);

alter table propostas add column dono_id bigint;
update propostas t set dono_id = c.dono_id from contatos c where c.id = t.contato_id;
alter table propostas alter column dono_id set not null;
alter table propostas add constraint propostas_contato_dono
  foreign key (contato_id, dono_id) references contatos (id, dono_id) on delete cascade;
create index propostas_dono_id on propostas (dono_id);

alter table reunioes add column dono_id bigint;
update reunioes t set dono_id = c.dono_id from contatos c where c.id = t.contato_id;
alter table reunioes alter column dono_id set not null;
alter table reunioes add constraint reunioes_contato_dono
  foreign key (contato_id, dono_id) references contatos (id, dono_id) on delete cascade;
alter table reunioes add constraint reunioes_id_dono unique (id, dono_id);
create index reunioes_dono_id on reunioes (dono_id);

-- Um participante (contato) tem de ser do mesmo dono que a reunião.
alter table reuniao_contatos add column dono_id bigint;
update reuniao_contatos t set dono_id = r.dono_id from reunioes r where r.id = t.reuniao_id;
alter table reuniao_contatos alter column dono_id set not null;
alter table reuniao_contatos add constraint reuniao_contatos_reuniao_dono
  foreign key (reuniao_id, dono_id) references reunioes (id, dono_id) on delete cascade;
alter table reuniao_contatos add constraint reuniao_contatos_contato_dono
  foreign key (contato_id, dono_id) references contatos (id, dono_id) on delete cascade;

commit;

-- Confirmação: quantos contatos tem cada utilizador. Os atuais devem estar todos
-- no email do administrador principal.
select u.email, count(c.id) as contatos
from usuarios u left join contatos c on c.dono_id = u.id
group by u.email order by contatos desc;
