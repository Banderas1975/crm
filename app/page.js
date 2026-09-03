import { supabase } from "../lib/supabase";
import Formulario from "./formulario";
import Anotacao from "./anotacao";
import { salvarAnotacao } from "./actions";
import { exigirSessao } from "./sessao-actions";
import Navbar from "./navbar";
import FollowUp from "./follow-up";
import SeletorEtapa from "./seletor-etapa";
import { LIMITES } from "../lib/validacao";

export const dynamic = "force-dynamic";

const CORES_ETAPA = {
  novo: "var(--etapa-novo)",
  "em contato": "var(--etapa-em-contato)",
  proposta: "var(--etapa-proposta)",
  cliente: "var(--etapa-cliente)",
};

// Ordem do funil, do primeiro contacto ao negócio fechado.
const ETAPAS = ["novo", "em contato", "proposta", "cliente"];

// Fuso fixo para a data ficar igual aqui e no servidor onde o site for publicado.
const FORMATO_DATA = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Lisbon",
});

export default async function Home() {
  const utilizador = await exigirSessao();

  const { data: contatos, error } = await supabase
    .from("contatos")
    .select("id, nome, email, telefone, etapa")
    .order("criado_em", { ascending: false });

  const { data: anotacoes } = await supabase
    .from("anotacoes")
    .select("id, contato_id, texto, criado_em")
    .order("criado_em", { ascending: false });

  // Contagem por etapa a partir da lista que já temos: nenhuma busca extra ao banco,
  // e os números nunca ficam diferentes da lista que está logo abaixo deles.
  const porEtapa = Object.fromEntries(ETAPAS.map((etapa) => [etapa, 0]));
  for (const contato of contatos ?? []) {
    if (contato.etapa in porEtapa) porEtapa[contato.etapa] += 1;
  }

  // Agrupa as anotações por contato numa passagem só, em vez de uma busca por contato.
  const porContato = new Map();
  for (const nota of anotacoes ?? []) {
    const lista = porContato.get(nota.contato_id) ?? [];
    lista.push(nota);
    porContato.set(nota.contato_id, lista);
  }

  return (
    <main className="pagina">
      <Navbar utilizador={utilizador} atual="contatos" />

      <header className="cabecalho">
        <h1>Meu CRM</h1>
        <p className="apoio">Seus contatos e oportunidades de negócio em um só lugar.</p>
      </header>

      <section className="painel">
        <div className="painel-caixa">
          <p className="painel-numero">{contatos?.length ?? 0}</p>
          <p className="painel-rotulo">contatos</p>
        </div>

        {ETAPAS.map((etapa) => (
          <div key={etapa} className="painel-caixa">
            <p className="painel-numero" style={{ color: CORES_ETAPA[etapa] }}>
              {porEtapa[etapa]}
            </p>
            <p className="painel-rotulo" style={{ color: CORES_ETAPA[etapa] }}>
              {etapa}
            </p>
          </div>
        ))}
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">Novo contato</h2>
        <Formulario />
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">Contatos</h2>

        {error && <p className="erro">Não foi possível carregar os contatos.</p>}

        {!error && contatos.length === 0 && (
          <p className="apoio">Nenhum contato cadastrado ainda.</p>
        )}

        <ul className="lista">
          {contatos?.map((contato) => {
            const notas = porContato.get(contato.id) ?? [];

            return (
              <li key={contato.id}>
                <div className="contato-topo">
                  <div>
                    <p className="nome">{contato.nome}</p>
                    <p className="apoio">
                      {[contato.email, contato.telefone].filter(Boolean).join(" · ") ||
                        "Sem contato registrado"}
                    </p>
                  </div>
                  <SeletorEtapa
                    contatoId={contato.id}
                    etapa={contato.etapa}
                    cor={CORES_ETAPA[contato.etapa]}
                  />
                </div>

                <details className="anotacoes">
                  <summary>
                    Anotações {notas.length > 0 && `(${notas.length})`}
                  </summary>

                  {notas.length === 0 ? (
                    <p className="apoio">Nenhuma anotação ainda.</p>
                  ) : (
                    <ul className="notas">
                      {notas.map((nota) => (
                        <Anotacao
                          key={nota.id}
                          nota={nota}
                          data={FORMATO_DATA.format(new Date(nota.criado_em))}
                        />
                      ))}
                    </ul>
                  )}

                  <form action={salvarAnotacao}>
                    <input type="hidden" name="contato_id" value={contato.id} />
                    <textarea
                      name="texto"
                      rows={3}
                      required
                      maxLength={LIMITES.anotacao}
                      placeholder={`Escreva uma anotação sobre ${contato.nome}...`}
                    />
                    <button className="botao botao-pequeno">Adicionar anotação</button>
                  </form>
                </details>

                <FollowUp contatoId={contato.id} />
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
