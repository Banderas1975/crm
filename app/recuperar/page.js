import Link from "next/link";
import FormRecuperar from "../form-recuperar";

// Dinâmica: só assim leva o nonce da CSP e os scripts do formulário correm.
export const dynamic = "force-dynamic";
export const metadata = { title: "Recuperar password — Meu CRM" };

export default function Recuperar() {
  return (
    <main className="pagina pagina-login">
      <header className="cabecalho">
        <h1>Esqueci-me da password</h1>
        <p className="apoio">Escreva o email da sua conta e enviamos-lhe um link para escolher uma password nova.</p>
      </header>

      <section className="cartao">
        <FormRecuperar />
        <p className="apoio rodape-form">
          Lembrou-se? <Link href="/login">Voltar ao login</Link>
        </p>
      </section>
    </main>
  );
}
