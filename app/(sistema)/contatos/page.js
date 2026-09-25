import Link from "next/link";
import Formulario from "../../formulario";
import { supabase } from "../../../lib/supabase";
import { exigirSessao } from "../../acesso";
import { CORES_ETAPA } from "../../etapas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contatos — Meu CRM" };

const POR_PAGINA = 50;

// O termo entra num filtro do PostgREST, onde a vírgula, os parênteses e as
// aspas separam ou delimitam condições. Tirá-los evita que uma busca esquisita
// mude a consulta. O corte em 80 evita termos absurdamente longos.
function limparTermo(cru) {
  return (cru ?? "").trim().slice(0, 80).replace(/[,()"\\]/g, "");
}

export default async function Contatos({ searchParams }) {
  const eu = await exigirSessao();

  const { q, pagina: paginaCrua } = await searchParams;
  const termo = limparTermo(q);

  const { data: achados } = termo
    ? await supabase
        .from("contatos")
        .select("id, nome, email, etapa")
        .eq("dono_id", eu.id)
        .or(`nome.ilike.%${termo}%,email.ilike.%${termo}%`)
        .order("nome")
        .limit(20)
    : { data: null };

  // A lista completa, por ordem alfabética, aos bocados de 50.
  const { count } = await supabase
    .from("contatos")
    .select("id", { count: "exact", head: true })
    .eq("dono_id", eu.id);
  const paginas = Math.max(1, Math.ceil((count ?? 0) / POR_PAGINA));
  // Só aceita números inteiros dentro do intervalo; o resto cai na primeira ou na última.
  const pagina = Math.min(paginas, Math.max(1, Number.parseInt(paginaCrua, 10) || 1));
  const inicio = (pagina - 1) * POR_PAGINA;

  const { data: todos } = await supabase
    .from("contatos")
    .select("id, nome, email, etapa")
    .eq("dono_id", eu.id)
    .order("nome")
    .order("id")
    .range(inicio, inicio + POR_PAGINA - 1);

  // Muda de página sem perder a busca que estiver feita.
  const irPara = (n) => `/contatos?${new URLSearchParams({ ...(termo && { q: termo }), pagina: n })}#todos`;

  const linha = (contato) => (
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
  );

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
            {achados.map(linha)}
          </ul>
        )}
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">Novo contato</h2>
        <Formulario />
      </section>

      <section className="cartao" id="todos">
        <h2 className="titulo-secao">
          Todos os contatos {count > 0 && <span className="mono">({count})</span>}
        </h2>

        {!todos?.length ? (
          <p className="apoio">Ainda não há contatos.</p>
        ) : (
          <ul className="lista">{todos.map(linha)}</ul>
        )}

        {paginas > 1 && (
          <nav className="paginacao" aria-label="Páginas">
            {pagina > 1 ? (
              <Link className="botao-contorno" href={irPara(pagina - 1)}>
                ‹ Anterior
              </Link>
            ) : (
              <span />
            )}
            <span className="apoio mono">
              página {pagina} de {paginas}
            </span>
            {pagina < paginas ? (
              <Link className="botao-contorno" href={irPara(pagina + 1)}>
                Seguinte ›
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>
    </>
  );
}
