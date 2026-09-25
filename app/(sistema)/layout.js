import NavLateral from "../nav-lateral";
import { supabase } from "../../lib/supabase";
import { sair } from "../sessao-actions";
import { exigirSessao } from "../acesso";
import { hojeEmLisboa } from "../tempo";

// Shell de aplicação: navegação lateral fixa + cabeçalho.
// Vale para todas as áreas do sistema. Login e criar conta ficam de fora.
export default async function Sistema({ children }) {
  const utilizador = await exigirSessao();

  // O que está a pedir atenção: atrasado ou para hoje. É contado no banco a
  // cada visita e não fica guardado em lado nenhum — por isso não há estado
  // que possa dessincronizar nem aviso que apareça duas vezes.
  const { count } = await supabase
    .from("tarefas")
    .select("id", { count: "exact", head: true })
    .eq("dono_id", utilizador.id)
    .is("concluida_em", null)
    .not("vence_em", "is", null)
    .lte("vence_em", hojeEmLisboa());

  return (
    <div className="shell">
      <NavLateral admin={utilizador.papel === "admin"} aFazer={count ?? 0} />

      <div className="area">
        <header className="cabecalho-app">
          <p className="marca">Meu CRM</p>
          <div className="conta">
            <span className="apoio mono">{utilizador.email}</span>
            <form action={sair}>
              <button className="botao-texto">Sair</button>
            </form>
          </div>
        </header>

        <main className="conteudo">{children}</main>
      </div>
    </div>
  );
}
