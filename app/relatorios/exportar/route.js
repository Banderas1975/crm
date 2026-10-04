import { gerarXlsx } from "../../../lib/xlsx";
import { exigirSessao } from "../../acesso";
import { lerFiltros, carregarDados, calcular } from "../../relatorios";
import { hojeEmLisboa } from "../../tempo";

// Cada relatório como folha(s) de Excel, com os mesmos filtros do ecrã.
// Valores em euros e percentagens vão como números, para se poderem somar.
const pct = (v) => (v === null || v === undefined ? "" : Math.round(v * 1000) / 10);
const eur = (v) => (v === null || v === undefined ? "" : Math.round(v * 100) / 100);
const dias = (v) => (v === null ? "" : Math.round(v * 10) / 10);

const FOLHAS = {
  funil: (r) => [
    {
      nomeFolha: "Funil de conversão",
      cabecalho: ["Etapa", "Contatos", "Valor (€)", "Passaram à seguinte (%)", "Tempo médio (dias)", "Estadias medidas"],
      linhas: r.funil.etapas.map((e) => [e.etapa, e.contatos, eur(e.valor), pct(e.taxaSeguinte), dias(e.diasMedios), e.estadias]),
      larguras: [16, 12, 14, 24, 20, 18],
    },
  ],
  receita: (r) => [
    {
      nomeFolha: "Receita por mês",
      cabecalho: ["Mês", "Receita (€)", "Negócios", "Meta (€)", "Atingido (%)", "Ritmo (€/dia)", "Projeção (€)", "Falta (€/dia)"],
      linhas: r.receita.porMes.map((m) => [
        m.mes, eur(m.receita), m.negocios, eur(m.meta), pct(m.atingido), eur(m.ritmoDia), eur(m.projecao), eur(m.faltaPorDia),
      ]),
      larguras: [10, 14, 10, 14, 14, 14, 14, 14],
    },
    {
      nomeFolha: "Receita por cliente",
      cabecalho: ["Cliente", "Ganho em", "Origem", "Valor (€)"],
      linhas: r.receita.porCliente.map((c) => [c.nome, c.dia, c.origem, eur(c.valor)]),
      larguras: [34, 12, 18, 14],
    },
  ],
  pipeline: (r) => [
    {
      nomeFolha: "Pipeline por etapa",
      cabecalho: ["Etapa", "Probabilidade (%)", "Negócios", "Valor (€)", "Ponderado (€)"],
      linhas: r.pipeline.porEtapa.map((e) => [e.etapa, pct(e.probabilidade), e.negocios, eur(e.valor), eur(e.ponderado)]),
      larguras: [16, 18, 10, 14, 14],
    },
    {
      nomeFolha: "Negócios em aberto",
      cabecalho: ["Contato", "Etapa", "Fecho previsto", "Valor (€)", "Probabilidade (%)", "Ponderado (€)"],
      linhas: r.pipeline.negocios.map((n) => [n.nome, n.etapa, n.fecho ?? "sem data", eur(n.valor), pct(n.probabilidade), eur(n.ponderado)]),
      larguras: [34, 14, 16, 14, 18, 14],
    },
  ],
  perdas: (r) => [
    {
      nomeFolha: "Motivos de perda",
      cabecalho: ["Motivo", "Negócios", "Parte (%)", "Valor perdido (€)"],
      linhas: r.perdas.motivos.map((m) => [m.motivo, m.negocios, pct(m.parte), eur(m.valor)]),
      larguras: [24, 10, 12, 18],
    },
  ],
  origens: (r) => [
    {
      nomeFolha: "Origem e receita",
      cabecalho: ["Origem", "Leads", "Já clientes", "Conversão (%)", "Ganhos", "Receita (€)", "Ticket médio (€)"],
      linhas: r.origens.map((o) => [o.origem, o.leads, o.convertidos, pct(o.conversao), o.ganhos, eur(o.receita), eur(o.ticketMedio)]),
      larguras: [18, 10, 12, 14, 10, 14, 16],
    },
  ],
};

export async function GET(pedido) {
  const eu = await exigirSessao();

  const parametros = Object.fromEntries(new URL(pedido.url).searchParams);
  if (!Object.hasOwn(FOLHAS, parametros.r)) return new Response("Relatório inválido.", { status: 400 });

  const filtros = lerFiltros(parametros);
  let resultado;
  try {
    resultado = calcular(await carregarDados(eu.id), filtros);
  } catch (erro) {
    console.error("Falha a exportar relatório:", erro.message);
    return new Response("Não foi possível exportar agora. Tente de novo.", { status: 500 });
  }

  // Uma folha final com os filtros usados: o ficheiro explica-se sozinho.
  const filtrosFolha = {
    nomeFolha: "Filtros",
    cabecalho: ["Filtro", "Valor"],
    linhas: [
      ["De", filtros.de],
      ["Até", filtros.ate],
      ["Origem", filtros.origem || "Todas"],
      ["Exportado em", hojeEmLisboa()],
    ],
    larguras: [16, 24],
  };

  const ficheiro = gerarXlsx({ folhas: [...FOLHAS[parametros.r](resultado), filtrosFolha] });

  return new Response(ficheiro, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="relatorio-${parametros.r}-${filtros.de}-a-${filtros.ate}.xlsx"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
