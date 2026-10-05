-- v16 · O registo de emails passa a aceitar o email de conta ativada, enviado
-- a quem o administrador aprova. Correr UMA vez no SQL Editor do Supabase,
-- depois do aviso-registo.sql.

begin;

alter table emails_enviados drop constraint emails_enviados_tipo_check;
alter table emails_enviados add constraint emails_enviados_tipo_check
  check (tipo in ('tarefas', 'tarefa_antes', 'reuniao_antes', 'reuniao_alterada', 'teste', 'recuperar', 'lead', 'registo', 'aprovado'));

commit;
