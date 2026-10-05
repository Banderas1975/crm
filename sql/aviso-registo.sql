-- v16 · O registo de emails passa a aceitar o aviso de conta nova ao
-- administrador. Correr UMA vez no SQL Editor do Supabase.

begin;

alter table emails_enviados drop constraint emails_enviados_tipo_check;
alter table emails_enviados add constraint emails_enviados_tipo_check
  check (tipo in ('tarefas', 'tarefa_antes', 'reuniao_antes', 'reuniao_alterada', 'teste', 'recuperar', 'lead', 'registo'));

commit;
