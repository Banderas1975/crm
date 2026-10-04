import Link from "next/link";
import { cookies } from "next/headers";
import BotaoTema from "../botao-tema";
import CampoSenha from "../campo-senha";
import { entrar } from "../sessao-actions";
import { LIMITES } from "../../lib/validacao";

// O login é a página pública: é a que aparece no Google.
export const metadata = { title: "CRM para PME em Portugal | First Media CRM" };

const ERROS = {
  invalido: "Usuário ou senha inválidos.",
  pendente: "A sua conta ainda está por aprovar pelo administrador.",
  bloqueado: "Demasiadas tentativas erradas. Por segurança, este email fica bloqueado durante 15 minutos.",
};

export default async function Login({ searchParams }) {
  const { erro, registado, senha } = await searchParams;

  const tema = (await cookies()).get("tema")?.value === "claro" ? "claro" : "escuro";

  return (
    <main className="pagina pagina-login">
      <div className="tema-entrada">
        <BotaoTema inicial={tema} />
      </div>
      <header className="cabecalho">
        <h1>First Media CRM</h1>
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
            <CampoSenha id="senha" name="senha" maxLength={LIMITES.senha} autoComplete="current-password" />
          </div>

          {senha === "alterada" && (
            <p className="aviso" aria-live="polite">
              Password mudada. Entre com a password nova.
            </p>
          )}

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
          <p className="ajuda link-recuperar">
            <Link href="/recuperar">Esqueci-me da password</Link>
          </p>
        </form>

        <p className="apoio rodape-form">
          Ainda não tem conta? <Link href="/registo">Criar conta</Link>
        </p>
      </section>
    </main>
  );
}
