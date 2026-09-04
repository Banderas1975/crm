import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { exigirSessao } from "../sessao-actions";
import { ETAPAS, CORES_ETAPA } from "../etapas";
import { haQuantoTempo } from "../tempo";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  await exigirSessao();

  // Uma busca só serve os três blocos: os números, o gráfico e os recentes.
  const { data: contatos, error } = await supabase
    .from("contatos")
    .select("id, nome, etapa, criado_em")
    .order("criado_em", { ascending: false });

  const lista = contatos ?? [];

  const porEtapa = Object.fromEntries(ETAPAS.map((etapa) => [etapa, 0]));
  for (const contato of lista) {
    if (contato.etapa in porEtapa) porEtapa[contato.etapa] += 1;
  }

  // A barra mais comprida é a da etapa com mais contatos: assim as etapas
  // pequenas continuam visíveis em vez de virarem um risco fino.
  const maior = Math.max(1, ...ETAPAS.map((etapa) => porEtapa[etapa]));
  const recentes = lista.slice(0, 5);

  return (
    <>
      <header className="cabecalho">
        <h1>Dashboard</h1>
        <p className="apoio">Os números do seu funil agora.</p>
      </header>

      {error && <p className="erro">Não foi possível carregar os números.</p>}

      <section className="painel">
        <div className="painel-caixa">
          <p className="painel-numero">{lista.length}</p>
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
        <h2 className="titulo-secao">Distribuição por etapa</h2>

        {lista.length === 0 ? (
          <p className="apoio">Sem contatos ainda — o gráfico aparece quando cadastrar o primeiro.</p>
        ) : (
          <div className="grafico">
            {ETAPAS.map((etapa) => (
              <div key={etapa} className="grafico-linha">
                <p className="grafico-nome" style={{ color: CORES_ETAPA[etapa] }}>
                  {etapa}
                </p>
                <div className="grafico-barra">
                  <div
                    className="grafico-preenchido"
                    style={{
                      width: `${(porEtapa[etapa] / maior) * 100}%`,
                      background: CORES_ETAPA[etapa],
                    }}
                    aria-hidden="true"
                  />
                </div>
                <p className="grafico-valor">{porEtapa[etapa]}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">Últimos contatos</h2>

        {recentes.length === 0 ? (
          <p className="apoio">Nenhum contato cadastrado ainda.</p>
        ) : (
          <ul className="lista">
            {recentes.map((contato) => (
              <li key={contato.id}>
                <div className="contato-topo">
                  <div>
                    <p className="resultado-nome">
                      <Link href={`/contatos/${contato.id}`}>{contato.nome}</Link>
                    </p>
                    <p className="apoio mono">{haQuantoTempo(contato.criado_em)}</p>
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
    </>
  );
}
