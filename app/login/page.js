import Link from "next/link";
import { entrar } from "../sessao-actions";
import { LIMITES } from "../../lib/validacao";

export const metadata = { title: "Entrar — Meu CRM" };

const ERROS = {
  invalido: "Usuário ou senha inválidos.",
  pendente: "A sua conta ainda está por aprovar pelo administrador.",
};

export default async function Login({ searchParams }) {
  const { erro, registado } = await searchParams;

  return (
    <main className="pagina pagina-login">
      <header className="cabecalho">
        <h1>Meu CRM</h1>
        <p className="apoio">Entre para ver os seus contatos.</p>
      </header>

      <section className="cartao">
        <form action={entrar}>
          <div className="campo">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required maxLength={LIMITES.email} autoComplete="username" autoFocus />
          </div>

          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input id="senha" name="senha" type="password" required maxLength={LIMITES.senha} autoComplete="current-password" />
          </div>

          {registado && (
            <p className="aviso" aria-live="polite">
              Conta criada. Só pode entrar depois de o administrador aprovar.
            </p>
          )}

          {erro && (
            <p className="erro" aria-live="polite">
              {ERROS[erro] ?? ERROS.invalido}
            </p>
          )}

          <button className="botao">Entrar</button>
        </form>

        <p className="apoio rodape-form">
          Ainda não tem conta? <Link href="/registo">Criar conta</Link>
        </p>
      </section>
    </main>
  );
}
