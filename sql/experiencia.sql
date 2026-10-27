-- v16 · 14 dias grátis: quem cria conta entra logo, sem esperar pela aprovação
-- do administrador, até à data em experiencia_ate. Depois disso a conta fica
-- bloqueada (com os dados guardados) até ser aprovada. Correr UMA vez no SQL
-- Editor do Supabase, depois do aviso-registo-recebido.sql.

begin;

alter table usuarios add column experiencia_ate timestamptz;

-- O registo de emails passa a aceitar o aviso de fim da experiência.
alter table emails_enviados drop constraint emails_enviados_tipo_check;
alter table emails_enviados add constraint emails_enviados_tipo_check
  check (tipo in ('tarefas', 'tarefa_antes', 'reuniao_antes', 'reuniao_alterada', 'teste', 'recuperar', 'lead', 'registo', 'aprovado', 'registo_recebido', 'experiencia_fim'));

commit;
