import { createHash } from "node:crypto";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import FormNovaSenha from "../../form-nova-senha";

export const dynamic = "force-dynamic";
export const metadata = { title: "Password nova — First Media CRM" };

// Só mostra o formulário se o link ainda servir. A verificação que conta é
// repetida na action, no momento de gravar.
export default async function NovaSenha({ params }) {
  const { token } = await params;
  const formatoOk = /^[A-Za-z0-9_-]{20,100}$/.test(token);

  const { data: pedido } = formatoOk
    ? await supabase
        .from("recuperacoes_senha")
        .select("id")
        .eq("token_hash", createHash("sha256").update(token).digest("hex"))
        .is("usado_em", null)
        .gt("expira_em", new Date().toISOString())
        .maybeSingle()
    : { data: null };

  return (
    <main className="pagina pagina-login">
      <header className="cabecalho">
        <h1>Password nova</h1>
        <p className="apoio">
          {pedido ? "Escolha a password nova. Depois, entre com ela." : "Este link já foi usado ou expirou."}
        </p>
      </header>

      <section className="cartao">
        {pedido ? (
          <FormNovaSenha token={token} />
        ) : (
          <p className="apoio">
            <Link href="/recuperar">Pedir um link novo</Link>
          </p>
        )}
        <p className="apoio rodape-form">
          <Link href="/login">Voltar ao login</Link>
        </p>
      </section>
    </main>
  );
}
