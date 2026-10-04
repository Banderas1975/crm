import Link from "next/link";
import NovaMeta from "./nova-meta";
import { CORES_ETAPA, ORIGENS } from "./etapas";
import { SEM_ORIGEM } from "./relatorios";
import { formatarDia } from "./tempo";

const EUROS = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const PERCENT = new Intl.NumberFormat("pt-PT", { style: "percent", maximumFractionDigits: 0 });
const DIAS = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 1 });
const MES = new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric", timeZone: "UTC" });

const euros = (v) => EUROS.format(v ?? 0);
const percent = (v) => (v === null || v === undefined ? "—" : PERCENT.format(v));
const nomeMes = (chave) => MES.format(new Date(`${chave}-01T00:00:00Z`));

// Barra horizontal fina. O número vai sempre em texto ao lado: a barra só ajuda o olho.
function Barra({ parte, cor = "var(--destaque)", titulo }) {
  return (
    <div className="grafico-barra rel-barra" title={titulo}>
      <div
        className="grafico-preenchido"
        style={{ width: `${Math.max(0, Math.min(1, parte)) * 100}%`, background: cor }}
        aria-hidden="true"
      />
    </div>
  );
}

function Cabecalho({ numero, titulo, descricao, exportar }) {
  return (
    <div className="rel-topo">
      <div>
        <h3 className="rel-titulo">
          <span className="mono rel-numero">{numero}</span> {titulo}
        </h3>
        <p className="apoio">{descricao}</p>
      </div>
      <a className="botao-contorno" href={exportar} download>
        Exportar .xlsx
      </a>
    </div>
  );
}

export default function RelatoriosPainel({ r, filtros }) {
  const consulta = new URLSearchParams({ de: filtros.de, ate: filtros.ate, ...(filtros.origem && { origem: filtros.origem }) });
  const exportar = (qual) => `/relatorios/exportar?r=${qual}&${consulta}`;

  const maiorFunil = Math.max(1, r.funil.etapas[0].contatos);
  const maiorMes = Math.max(1, ...r.receita.porMes.map((m) => Math.max(m.receita, m.meta ?? 0)));
  const maiorPipe = Math.max(1, ...r.pipeline.porEtapa.map((e) => e.valor));
  const maiorPerda = Math.max(1, ...r.perdas.motivos.map((m) => m.negocios));
  const maiorOrigem = Math.max(1, ...r.origens.map((o) => o.receita));

  return (
    <>
      <header className="cabecalho" id="relatorios">
        <h2 className="titulo-area">Relatórios</h2>
        <p className="apoio">Os mesmos filtros valem para os cinco.</p>
      </header>

      {/* Filtros numa linha, acima de tudo. GET: o endereço guarda a escolha. */}
      <form className="cartao rel-filtros" action="/#relatorios">
        <div className="campo">
          <label htmlFor="f-de">De</label>
          <input id="f-de" name="de" type="date" defaultValue={filtros.de} required />
        </div>
        <div className="campo">
          <label htmlFor="f-ate">Até</label>
          <input id="f-ate" name="ate" type="date" defaultValue={filtros.ate} required />
        </div>
        <div className="campo">
          <label htmlFor="f-origem">Origem</label>
          <select id="f-origem" name="origem" defaultValue={filtros.origem}>
            <option value="">Todas</option>
            {[...ORIGENS, SEM_ORIGEM].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <button className="botao botao-pequeno">Aplicar</button>
        <Link className="botao-texto" href="/#relatorios">
          Limpar
        </Link>
      </form>

      {/* 1. Funil de conversão */}
      <section className="cartao">
        <Cabecalho
          numero="1"
          titulo="Funil de conversão"
          descricao={`Os ${r.funil.total} contatos que entraram no período: quantos chegaram a cada etapa, com que valor, quantos passaram à seguinte e quanto tempo ficaram.`}
          exportar={exportar("funil")}
        />
        {r.funil.total === 0 ? (
          <p className="apoio">Nenhum contato entrou neste período.</p>
        ) : (
          <div className="rel-tabela-rolar">
            <table className="rel-tabela">
              <thead>
                <tr>
                  <th>Etapa</th>
                  <th className="rel-larga" aria-label="Gráfico" />
                  <th>Contatos</th>
                  <th>Valor</th>
                  <th>Passaram à seguinte</th>
                  <th>Tempo médio</th>
                </tr>
              </thead>
              <tbody>
                {r.funil.etapas.map((e) => (
                  <tr key={e.etapa}>
                    <td className="rel-etapa" style={{ color: CORES_ETAPA[e.etapa] }}>
                      {e.etapa}
                    </td>
                    <td className="rel-larga">
                      <Barra parte={e.contatos / maiorFunil} cor={CORES_ETAPA[e.etapa]} titulo={`${e.etapa}: ${e.contatos} contatos`} />
                    </td>
                    <td className="mono">{e.contatos}</td>
                    <td className="mono">{euros(e.valor)}</td>
                    <td className="mono">{e.taxaSeguinte === null ? "—" : percent(e.taxaSeguinte)}</td>
                    <td className="mono">
                      {e.diasMedios === null ? "—" : `${DIAS.format(e.diasMedios)} dias`}
                      {e.estadias > 0 && <span className="rel-nota"> ({e.estadias})</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="ajuda">
          Perdidos neste grupo: <span className="mono">{r.funil.perdidos}</span>. O tempo médio só conta
          estadias já terminadas (entre parênteses, quantas) e o histórico de etapas começou com a v8.
        </p>
      </section>

      {/* 2. Receita vs meta */}
      <section className="cartao">
        <Cabecalho
          numero="2"
          titulo="Receita vs meta"
          descricao="Negócios ganhos no período, pelo valor da proposta. No mês corrente: ritmo e projeção."
          exportar={exportar("receita")}
        />
        <div className="painel rel-numeros">
          <div className="painel-caixa">
            <p className="painel-numero">{euros(r.receita.total)}</p>
            <p className="painel-rotulo">receita</p>
          </div>
          <div className="painel-caixa">
            <p className="painel-numero">{r.receita.meta ? euros(r.receita.meta) : "—"}</p>
            <p className="painel-rotulo">meta do período</p>
          </div>
          <div className="painel-caixa">
            <p className="painel-numero">{r.receita.meta ? percent(r.receita.total / r.receita.meta) : "—"}</p>
            <p className="painel-rotulo">atingido</p>
          </div>
        </div>

        <div className="rel-tabela-rolar">
          <table className="rel-tabela">
            <thead>
              <tr>
                <th>Mês</th>
                <th className="rel-larga" aria-label="Gráfico" />
                <th>Receita</th>
                <th>Meta</th>
                <th>Atingido</th>
                <th className="rel-esquerda">Ritmo e projeção</th>
              </tr>
            </thead>
            <tbody>
              {r.receita.porMes.map((m) => (
                <tr key={m.mes}>
                  <td className="mono">{nomeMes(m.mes)}</td>
                  <td className="rel-larga">
                    <div className="rel-meta-barra">
                      <Barra parte={m.receita / maiorMes} titulo={`Receita: ${euros(m.receita)}`} />
                      {m.meta && (
                        <span
                          className="rel-meta-marca"
                          style={{ left: `${(m.meta / maiorMes) * 100}%` }}
                          title={`Meta: ${euros(m.meta)}`}
                        />
                      )}
                    </div>
                  </td>
                  <td className="mono">{euros(m.receita)}</td>
                  <td className="mono">{m.meta ? euros(m.meta) : "—"}</td>
                  <td className="mono">{percent(m.atingido)}</td>
                  <td className="mono rel-pequeno">
                    {m.projecao !== undefined ? (
                      <>
                        {euros(m.ritmoDia)}/dia · projeção {euros(m.projecao)}
                        {m.meta && m.faltaPorDia > 0 && <> · faltam {euros(m.faltaPorDia)}/dia</>}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <NovaMeta />

        <h4 className="rel-subtitulo">Por cliente</h4>
        {r.receita.porCliente.length === 0 ? (
          <p className="apoio">Nenhum negócio ganho neste período.</p>
        ) : (
          <div className="rel-tabela-rolar">
            <table className="rel-tabela">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Ganho em</th>
                  <th>Origem</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {r.receita.porCliente.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/contatos/${c.id}`}>{c.nome}</Link>
                    </td>
                    <td className="mono">{formatarDia(c.dia)}</td>
                    <td>{c.origem}</td>
                    <td className="mono">{euros(c.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {r.receita.semData > 0 && (
          <p className="ajuda">
            {r.receita.semData} cliente(s) ganhos antes da v8 não têm data de ganho e não entram na receita por mês.
          </p>
        )}
      </section>

      {/* 3. Pipeline aberto */}
      <section className="cartao">
        <Cabecalho
          numero="3"
          titulo="Pipeline aberto"
          descricao="Todos os negócios em aberto agora, ponderados pela probabilidade da etapa. Não depende do período, só da origem."
          exportar={exportar("pipeline")}
        />
        <div className="painel rel-numeros">
          <div className="painel-caixa">
            <p className="painel-numero">{euros(r.pipeline.valor)}</p>
            <p className="painel-rotulo">em aberto</p>
          </div>
          <div className="painel-caixa">
            <p className="painel-numero">{euros(r.pipeline.ponderado)}</p>
            <p className="painel-rotulo">ponderado</p>
          </div>
          <div className="painel-caixa">
            <p className="painel-numero">{r.pipeline.negocios.length}</p>
            <p className="painel-rotulo">negócios</p>
          </div>
        </div>

        <div className="rel-tabela-rolar">
          <table className="rel-tabela">
            <thead>
              <tr>
                <th>Etapa</th>
                <th className="rel-larga" aria-label="Gráfico" />
                <th>Probabilidade</th>
                <th>Negócios</th>
                <th>Valor</th>
                <th>Ponderado</th>
              </tr>
            </thead>
            <tbody>
              {r.pipeline.porEtapa.map((e) => (
                <tr key={e.etapa}>
                  <td className="rel-etapa" style={{ color: CORES_ETAPA[e.etapa] }}>
                    {e.etapa}
                  </td>
                  <td className="rel-larga">
                    <Barra parte={e.valor / maiorPipe} cor={CORES_ETAPA[e.etapa]} titulo={`${e.etapa}: ${euros(e.valor)}`} />
                  </td>
                  <td className="mono">{percent(e.probabilidade)}</td>
                  <td className="mono">{e.negocios}</td>
                  <td className="mono">{euros(e.valor)}</td>
                  <td className="mono">{euros(e.ponderado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {r.pipeline.negocios.length > 0 && (
          <details className="feitas">
            <summary>
              Negócios, por data de fecho prevista <span className="mono">({r.pipeline.negocios.length})</span>
            </summary>
            <div className="rel-tabela-rolar">
              <table className="rel-tabela">
                <thead>
                  <tr>
                    <th>Contato</th>
                    <th>Etapa</th>
                    <th>Fecho previsto</th>
                    <th>Valor</th>
                    <th>Ponderado</th>
                  </tr>
                </thead>
                <tbody>
                  {r.pipeline.negocios.map((n) => (
                    <tr key={n.id}>
                      <td>
                        <Link href={`/contatos/${n.id}`}>{n.nome}</Link>
                      </td>
                      <td className="rel-etapa" style={{ color: CORES_ETAPA[n.etapa] }}>
                        {n.etapa}
                      </td>
                      <td className="mono">
                        {n.fecho ? formatarDia(n.fecho) : "sem data"}
                        {n.atrasado && <span className="rel-atrasado"> · passou</span>}
                      </td>
                      <td className="mono">{euros(n.valor)}</td>
                      <td className="mono">{euros(n.ponderado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
        <p className="ajuda">
          Probabilidades fixas: novo 10%, em contato 25%, proposta 50%. Valor de cada negócio = o da proposta mais recente.
          {r.pipeline.semData > 0 && ` ${r.pipeline.semData} sem data de fecho prevista.`}
        </p>
      </section>

      {/* 4. Motivos de perda */}
      <section className="cartao">
        <Cabecalho
          numero="4"
          titulo="Motivos de perda"
          descricao={`Os ${r.perdas.total} negócios perdidos no período (${euros(r.perdas.valor)}), por motivo.`}
          exportar={exportar("perdas")}
        />
        {r.perdas.total === 0 ? (
          <p className="apoio">Nenhum negócio perdido neste período.</p>
        ) : (
          <div className="rel-tabela-rolar">
            <table className="rel-tabela">
              <thead>
                <tr>
                  <th>Motivo</th>
                  <th className="rel-larga" aria-label="Gráfico" />
                  <th>Negócios</th>
                  <th>Parte</th>
                  <th>Valor perdido</th>
                </tr>
              </thead>
              <tbody>
                {r.perdas.motivos.map((m) => (
                  <tr key={m.motivo}>
                    <td>{m.motivo}</td>
                    <td className="rel-larga">
                      <Barra parte={m.negocios / maiorPerda} titulo={`${m.motivo}: ${m.negocios}`} />
                    </td>
                    <td className="mono">{m.negocios}</td>
                    <td className="mono">{percent(m.parte)}</td>
                    <td className="mono">{euros(m.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="ajuda">
          O motivo é escolhido de uma lista fechada ao marcar um negócio como perdido. Com texto livre, "preço", "Preco" e
          "caro demais" seriam três linhas diferentes e nada somava.
        </p>
      </section>

      {/* 5. Origem → receita */}
      <section className="cartao">
        <Cabecalho
          numero="5"
          titulo="Origem → receita"
          descricao="Que canal gera negócio fechado, não só leads."
          exportar={exportar("origens")}
        />
        {r.origens.length === 0 ? (
          <p className="apoio">Sem leads nem negócios ganhos neste período.</p>
        ) : (
          <div className="rel-tabela-rolar">
            <table className="rel-tabela">
              <thead>
                <tr>
                  <th>Origem</th>
                  <th className="rel-larga" aria-label="Gráfico" />
                  <th>Leads</th>
                  <th>Já clientes</th>
                  <th>Conversão</th>
                  <th>Ganhos</th>
                  <th>Receita</th>
                  <th>Ticket médio</th>
                </tr>
              </thead>
              <tbody>
                {r.origens.map((o) => (
                  <tr key={o.origem}>
                    <td>{o.origem}</td>
                    <td className="rel-larga">
                      <Barra parte={o.receita / maiorOrigem} titulo={`${o.origem}: ${euros(o.receita)}`} />
                    </td>
                    <td className="mono">{o.leads}</td>
                    <td className="mono">{o.convertidos}</td>
                    <td className="mono">{percent(o.conversao)}</td>
                    <td className="mono">{o.ganhos}</td>
                    <td className="mono">{euros(o.receita)}</td>
                    <td className="mono">{o.ticketMedio === null ? "—" : euros(o.ticketMedio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="ajuda">
          Leads: contatos que entraram no período. Conversão: desses, quantos já são clientes. Receita: negócios ganhos no
          período, venham de quando vierem.
        </p>
      </section>
    </>
  );
}
