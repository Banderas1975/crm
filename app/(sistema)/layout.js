import NavLateral from "../nav-lateral";
import { exigirSessao, sair } from "../sessao-actions";

// Shell de aplicação: navegação lateral fixa + cabeçalho.
// Vale para todas as áreas do sistema. Login e criar conta ficam de fora.
export default async function Sistema({ children }) {
  const utilizador = await exigirSessao();

  return (
    <div className="shell">
      <NavLateral admin={utilizador.papel === "admin"} />

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
