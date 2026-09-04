import Link from "next/link";
import Formulario from "../../formulario";
import { supabase } from "../../../lib/supabase";
import { exigirSessao } from "../../sessao-actions";
import { CORES_ETAPA } from "../../etapas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contatos — Meu CRM" };

// O termo entra num filtro do PostgREST, onde a vírgula, os parênteses e as
// aspas separam ou delimitam condições. Tirá-los evita que uma busca esquisita
// mude a consulta. O corte em 80 evita termos absurdamente longos.
function limparTermo(cru) {
  return (cru ?? "").trim().slice(0, 80).replace(/[,()"\\]/g, "");
}

export default async function Contatos({ searchParams }) {
  await exigirSessao();

  const { q } = await searchParams;
  const termo = limparTermo(q);

  const { data: achados } = termo
    ? await supabase
        .from("contatos")
        .select("id, nome, email, etapa")
        .or(`nome.ilike.%${termo}%,email.ilike.%${termo}%`)
        .order("nome")
        .limit(20)
    : { data: null };

  return (
    <>
      <header className="cabecalho">
        <h1>Contatos</h1>
        <p className="apoio">Procure alguém, ou cadastre uma pessoa nova.</p>
      </header>

      <section className="cartao">
        <h2 className="titulo-secao">Buscar</h2>

        <form className="busca">
          <input
            type="search"
            name="q"
            defaultValue={termo}
            maxLength={80}
            placeholder="Nome ou email"
            aria-label="Buscar por nome ou email"
          />
          <button className="botao">Buscar</button>
        </form>

        {termo && achados?.length === 0 && (
          <p className="apoio">Nada encontrado para "{termo}".</p>
        )}

        {achados?.length > 0 && (
          <ul className="lista" style={{ marginTop: 24 }}>
            {achados.map((contato) => (
              <li key={contato.id}>
                <div className="contato-topo">
                  <div>
                    <p className="resultado-nome">
                      <Link href={`/contatos/${contato.id}`}>{contato.nome}</Link>
                    </p>
                    <p className="apoio mono">{contato.email || "Sem email"}</p>
                  </div>
                  <span
                    className="etiqueta"
                    style={{
                      color: CORES_ETAPA[contato.etapa],
                      borderColor: CORES_ETAPA[contato.etapa],
                    }}
                  >
                    {contato.etapa}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">Novo contato</h2>
        <Formulario />
      </section>
    </>
  );
}
