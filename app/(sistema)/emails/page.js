import { supabase } from "../../../lib/supabase";
import { exigirSessao } from "../../acesso";
import { envioConfigurado } from "../../../lib/email";
import PreferenciasEmail from "../../preferencias-email";


export const dynamic = "force-dynamic";
export const metadata = { title: "Emails — First Media CRM" };

const TIPOS = {
  tarefas: "Resumo de tarefas",
  tarefa_antes: "Tarefa em breve",
  reuniao_antes: "Reunião em breve",
  reuniao_alterada: "Reunião marcada/mudada",
  teste: "Teste",
  recuperar: "Recuperar password",
};

// Curto, para a tabela caber: "04/10, 05:30".
const QUANDO = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Lisbon",
});

const ESTADOS = { enviado: "enviado", falhou: "falhou", pendente: "a enviar" };

export default async function Emails() {
  const eu = await exigirSessao();

  const { data: conta } = await supabase
    .from("usuarios")
    .select("email, email_avisos, aviso_tarefas, aviso_tarefa_antes, aviso_reuniao_antes, aviso_reuniao_alterada")
    .eq("id", eu.id)
    .single();

  // Só os emails desta conta.
  const { data: historico } = await supabase
    .from("emails_enviados")
    .select("id, tipo, para, assunto, estado, erro, tentativas, criado_em")
    .eq("usuario_id", eu.id)
    .order("criado_em", { ascending: false })
    .limit(50);

  return (
    <>
      <header className="cabecalho">
        <h1>Emails</h1>
        <p className="apoio">Avisos de tarefas e reuniões, enviados por {process.env.SMTP_USER || "crm@firstmedia.pt"}.</p>
      </header>

      {!envioConfigurado() && (
        <p className="aviso">O envio ainda não está configurado no servidor: as preferências ficam guardadas, mas nenhum email sai.</p>
      )}

      <section className="cartao">
        <h2 className="titulo-secao">Preferências</h2>
        {conta ? <PreferenciasEmail conta={conta} /> : <p className="erro">Não foi possível carregar as preferências.</p>}
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">
          Histórico {historico?.length > 0 && <span className="mono">({historico.length})</span>}
        </h2>
        {!historico?.length ? (
          <p className="apoio">Ainda não lhe foi enviado nenhum email.</p>
        ) : (
          <div className="rel-tabela-rolar">
            <table className="rel-tabela tabela-emails">
              <thead>
                <tr>
                  <th>Quando</th>
                  <th className="rel-esquerda">Aviso</th>
                  <th className="rel-esquerda">Assunto</th>
                  <th className="rel-esquerda">Para</th>
                  <th className="rel-esquerda">Estado</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((e) => (
                  <tr key={e.id}>
                    <td className="mono rel-pequeno">{QUANDO.format(new Date(e.criado_em))}</td>
                    <td>{TIPOS[e.tipo] ?? e.tipo}</td>
                    <td className="email-assunto">{e.assunto}</td>
                    <td className="mono rel-pequeno email-para">{e.para}</td>
                    <td className={e.estado === "falhou" ? "email-falhou" : undefined}>
                      {ESTADOS[e.estado] ?? e.estado}
                      {e.estado === "falhou" && e.erro && <span className="rel-nota"> — {e.erro}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
