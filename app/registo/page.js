import Link from "next/link";
import { registar } from "../sessao-actions";
import { LIMITES } from "../../lib/validacao";

export const metadata = { title: "Criar conta — Meu CRM" };

const ERROS = {
  email: "Escreva um email válido.",
  senha: "A senha tem de ter pelo menos 8 caracteres.",
  repetido: "Já existe uma conta com esse email.",
  geral: "Não foi possível criar a conta. Tente de novo.",
};

export default async function Registo({ searchParams }) {
  const { erro } = await searchParams;

  return (
    <main className="pagina pagina-login">
      <header className="cabecalho">
        <h1>Criar conta</h1>
        <p className="apoio">A conta fica à espera de aprovação do administrador.</p>
      </header>

      <section className="cartao">
        <form action={registar}>
          <div className="campo">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required maxLength={LIMITES.email} autoComplete="email" autoFocus />
          </div>

          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              minLength={8}
              maxLength={LIMITES.senha}
              autoComplete="new-password"
            />
            <p className="ajuda">Pelo menos 8 caracteres.</p>
          </div>

          {erro && (
            <p className="erro" aria-live="polite">
              {ERROS[erro] ?? ERROS.geral}
            </p>
          )}

          <button className="botao">Criar conta</button>
        </form>

        <p className="apoio rodape-form">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </section>
    </main>
  );
}
