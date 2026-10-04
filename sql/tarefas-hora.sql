-- v10 · Hora nas tarefas e aviso 1 hora antes. Correr UMA vez no SQL Editor do
-- Supabase, depois do emails.sql. Tudo ou nada.

begin;

-- A hora é guardada como se lê num relógio de Lisboa ("14:30"), tal como o dia:
-- sem fuso para converter. As tarefas que já existem ficam sem hora.
alter table tarefas add column vence_hora time;

-- Hora sem dia não existe.
alter table tarefas add constraint tarefas_hora_com_dia check (vence_hora is null or vence_em is not null);

-- Preferência do aviso novo: ligado por omissão, como os outros.
alter table usuarios add column aviso_tarefa_antes boolean not null default true;

-- O registo de emails passa a aceitar o tipo novo.
alter table emails_enviados drop constraint emails_enviados_tipo_check;
alter table emails_enviados add constraint emails_enviados_tipo_check
  check (tipo in ('tarefas', 'tarefa_antes', 'reuniao_antes', 'reuniao_alterada', 'teste'));

commit;
