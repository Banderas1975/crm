import Link from "next/link";
import { sair } from "./sessao-actions";

// atual: "contatos" ou "usuarios" — marca a página onde estamos.
export default function Navbar({ utilizador, atual }) {
  return (
    <nav className="navbar">
      <div className="navbar-links">
        <Link href="/" className={atual === "contatos" ? "ativo" : undefined}>
          Contatos
        </Link>
        {utilizador.papel === "admin" && (
          <Link href="/usuarios" className={atual === "usuarios" ? "ativo" : undefined}>
            Usuários
          </Link>
        )}
      </div>

      <div className="navbar-conta">
        <span className="apoio">{utilizador.email}</span>
        <form action={sair}>
          <button className="botao-texto">Sair</button>
        </form>
      </div>
    </nav>
  );
}
