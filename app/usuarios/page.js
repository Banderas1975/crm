import Navbar from "../navbar";
import AcaoConfirmada from "../acao-confirmada";
import { supabase } from "../../lib/supabase";
import {
  exigirAdmin,
  aprovarUtilizador,
  recusarUtilizador,
  removerAcesso,
  promoverAdmin,
  despromoverAdmin,
} from "../sessao-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Usuários — Meu CRM" };

const FORMATO_DATA = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "long",
  timeZone: "Europe/Lisbon",
});

export default async function Usuarios() {
  const admin = await exigirAdmin();

  const { data: utilizadores } = await supabase
    .from("usuarios")
    .select("id, email, papel, estado, criado_em")
    .order("criado_em", { ascending: false });

  const pendentes = utilizadores?.filter((u) => u.estado === "pendente") ?? [];
  const aprovados = utilizadores?.filter((u) => u.estado === "aprovado") ?? [];

  return (
    <main className="pagina">
      <Navbar utilizador={admin} atual="usuarios" />

      <header className="cabecalho">
        <h1>Usuários</h1>
        <p className="apoio">Quem pode entrar no CRM. Contas novas ficam à sua espera.</p>
      </header>

      <section className="cartao">
        <h2 className="titulo-secao">
          À espera de aprovação {pendentes.length > 0 && `(${pendentes.length})`}
        </h2>

        {pendentes.length === 0 ? (
          <p className="apoio">Nenhuma conta à espera.</p>
        ) : (
          <ul className="lista">
            {pendentes.map((u) => (
              <li key={u.id}>
                <div className="contato-topo">
                  <div>
                    <p className="nome">{u.email}</p>
                    <p className="apoio">
                      Pediu acesso em {FORMATO_DATA.format(new Date(u.criado_em))}
                    </p>
                  </div>
                  <div className="acoes-nota">
                    <AcaoConfirmada
                      acao={recusarUtilizador}
                      id={u.id}
                      texto="Recusar"
                      className="botao-texto botao-excluir"
                      pergunta={`Recusar ${u.email}? A conta é apagada e a pessoa terá de se registar de novo.`}
                    />
                    <form action={aprovarUtilizador}>
                      <input type="hidden" name="id" value={u.id} />
                      <button className="botao botao-pequeno">Aprovar</button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">Com acesso ({aprovados.length})</h2>

        <ul className="lista">
          {aprovados.map((u) => {
            const souEu = u.id === admin.id;

            return (
              <li key={u.id}>
                <div className="contato-topo">
                  <div>
                    <p className="nome">
                      {u.email} {souEu && <span className="apoio">— você</span>}
                    </p>
                    <p className="apoio">Entrou em {FORMATO_DATA.format(new Date(u.criado_em))}</p>
                  </div>

                  <div className="acoes-nota">
                    {!souEu && u.papel === "usuario" && (
                      <AcaoConfirmada
                        acao={promoverAdmin}
                        id={u.id}
                        texto="Tornar admin"
                        pergunta={`Tornar ${u.email} administrador? Vai poder aprovar e remover utilizadores.`}
                      />
                    )}
                    {!souEu && u.papel === "admin" && (
                      <AcaoConfirmada
                        acao={despromoverAdmin}
                        id={u.id}
                        texto="Tornar usuário"
                        pergunta={`Tirar o cargo de administrador a ${u.email}? Deixa de poder gerir utilizadores, mas mantém o acesso ao CRM.`}
                      />
                    )}
                    {!souEu && (
                      <AcaoConfirmada
                        acao={removerAcesso}
                        id={u.id}
                        texto="Remover acesso"
                        className="botao-texto botao-excluir"
                        pergunta={`Remover o acesso de ${u.email}? Volta à fila de espera e é desligado já.`}
                      />
                    )}
                    <span
                      className={u.papel === "admin" ? "etiqueta etiqueta-admin" : "etiqueta"}
                    >
                      {u.papel === "admin" ? "administrador" : "usuário"}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
