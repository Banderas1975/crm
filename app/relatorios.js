// Os cinco relatórios: vão buscar os dados de quem pede e fazem as contas.
// Usado pelo Dashboard e pela exportação, para os números serem sempre os mesmos.
import { supabase } from "../lib/supabase";
import { ETAPAS_FUNIL, ETAPAS_ABERTAS, PROBABILIDADE, ORIGENS, MOTIVOS_PERDA } from "./etapas";
import { emLisboa, hojeEmLisboa } from "./tempo";
import { dataValida } from "../lib/validacao";

export const SEM_ORIGEM = "Sem origem";

// ---- filtros ----

// Lê os filtros do endereço. Sem período escolhido: do início do ano até hoje.
export function lerFiltros(pedido) {
  const hoje = hojeEmLisboa();
  let de = typeof pedido.de === "string" && dataValida(pedido.de) ? pedido.de : `${hoje.slice(0, 4)}-01-01`;
  let ate = typeof pedido.ate === "string" && dataValida(pedido.ate) ? pedido.ate : hoje;
  if (de > ate) [de, ate] = [ate, de];
  const origem = [...ORIGENS, SEM_ORIGEM].includes(pedido.origem) ? pedido.origem : "";
  return { de, ate, origem };
}

// ---- dados ----

// O Supabase devolve no máximo 1000 linhas por pedido: pede-se aos bocados.
async function tudo(consulta) {
  const linhas = [];
  for (let inicio = 0; ; inicio += 1000) {
    const { data, error } = await consulta().range(inicio, inicio + 999);
    if (error) throw new Error(error.message);
    linhas.push(...data);
    if (data.length < 1000) return linhas;
  }
}

export async function carregarDados(donoId) {
  const [contatos, propostas, historico, metas] = await Promise.all([
    tudo(() =>
      supabase
        .from("contatos")
        .select("id, nome, etapa, origem, criado_em, ganho_em, perdido_em, motivo_perda, fecho_previsto, proposta_ganha_id")
        .eq("dono_id", donoId)
        .order("id")
    ),
    tudo(() =>
      supabase.from("propostas").select("id, contato_id, valor, criado_em").eq("dono_id", donoId).order("id")
    ),
    tudo(() =>
      supabase
        .from("etapa_historico")
        .select("contato_id, etapa, entrou_em")
        .eq("dono_id", donoId)
        .order("contato_id")
        .order("entrou_em")
    ),
    tudo(() => supabase.from("metas").select("mes, valor").eq("dono_id", donoId).order("mes")),
  ]);
  return { contatos, propostas, historico, metas };
}

// ---- contas ----

const diaDe = (instante) => (instante ? emLisboa(instante).dia : null);
const noPeriodo = (dia, { de, ate }) => dia !== null && dia >= de && dia <= ate;
const origemDe = (contato) => contato.origem ?? SEM_ORIGEM;
const DIA_MS = 86400000;

// Valor do negócio: o da proposta com que foi ganho; se não, o da proposta mais
// recente; sem proposta, zero (conta no número de negócios, não no valor).
function valores(propostas, contatos) {
  const porId = new Map(propostas.map((p) => [p.id, Number(p.valor)]));
  const ultima = new Map();
  for (const p of propostas) {
    const atual = ultima.get(p.contato_id);
    if (!atual || p.criado_em > atual.criado_em) ultima.set(p.contato_id, p);
  }
  return new Map(
    contatos.map((c) => [
      c.id,
      porId.get(c.proposta_ganha_id) ?? (ultima.has(c.id) ? Number(ultima.get(c.id).valor) : 0),
    ])
  );
}

export function calcular(dados, filtros) {
  const hoje = hojeEmLisboa();
  const contatos = dados.contatos.filter((c) => !filtros.origem || origemDe(c) === filtros.origem);
  const valor = valores(dados.propostas, contatos);

  const historicoDe = new Map();
  for (const h of dados.historico) {
    if (!historicoDe.has(h.contato_id)) historicoDe.set(h.contato_id, []);
    historicoDe.get(h.contato_id).push(h);
  }

  return {
    funil: funil(contatos, valor, historicoDe, filtros),
    receita: receita(contatos, valor, dados.metas, filtros, hoje, dados.contatos),
    pipeline: pipeline(contatos, valor, hoje),
    perdas: perdas(contatos, valor, filtros),
    origens: origens(contatos, valor, filtros),
  };
}

// 1. Funil de conversão. Coorte: contatos que entraram no período. Um contato
// "chegou" a uma etapa se esteve nela ou numa mais à frente (perdido não conta
// como avanço). Tempo médio: só estadias já terminadas, do histórico.
function funil(contatos, valor, historicoDe, filtros) {
  const coorte = contatos.filter((c) => noPeriodo(diaDe(c.criado_em), filtros));
  const ordem = (etapa) => ETAPAS_FUNIL.indexOf(etapa);

  const chegaram = ETAPAS_FUNIL.map(() => ({ n: 0, valor: 0 }));
  const dias = ETAPAS_FUNIL.map(() => ({ soma: 0, n: 0 }));
  let perdidos = 0;

  for (const c of coorte) {
    const passos = historicoDe.get(c.id) ?? [];
    const maisLonge = Math.max(ordem(c.etapa), ...passos.map((p) => ordem(p.etapa)), 0);
    for (let k = 0; k <= maisLonge; k++) {
      chegaram[k].n += 1;
      chegaram[k].valor += valor.get(c.id);
    }
    if (c.etapa === "perdido") perdidos += 1;

    for (let i = 0; i < passos.length - 1; i++) {
      const k = ordem(passos[i].etapa);
      if (k < 0) continue;
      dias[k].soma += (Date.parse(passos[i + 1].entrou_em) - Date.parse(passos[i].entrou_em)) / DIA_MS;
      dias[k].n += 1;
    }
  }

  return {
    total: coorte.length,
    perdidos,
    etapas: ETAPAS_FUNIL.map((etapa, k) => ({
      etapa,
      contatos: chegaram[k].n,
      valor: chegaram[k].valor,
      // Dos que chegaram a esta etapa, quantos passaram à seguinte.
      taxaSeguinte: k < ETAPAS_FUNIL.length - 1 && chegaram[k].n ? chegaram[k + 1].n / chegaram[k].n : null,
      diasMedios: dias[k].n ? dias[k].soma / dias[k].n : null,
      estadias: dias[k].n,
    })),
  };
}

// Todos os meses AAAA-MM entre duas datas, inclusive.
function meses(de, ate) {
  const lista = [];
  let [ano, mes] = de.slice(0, 7).split("-").map(Number);
  const fim = ate.slice(0, 7);
  for (;;) {
    const chave = `${ano}-${String(mes).padStart(2, "0")}`;
    lista.push(chave);
    if (chave >= fim) return lista;
    mes += 1;
    if (mes > 12) [ano, mes] = [ano + 1, 1];
  }
}

const diasNoMes = (chave) => {
  const [ano, mes] = chave.split("-").map(Number);
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
};

// 2. Receita vs meta. Receita = negócios ganhos no período, pelo valor da proposta.
// No mês corrente: ritmo (receita por dia até hoje), projeção para o fim do mês
// e quanto falta por dia para chegar à meta.
function receita(contatos, valor, metas, filtros, hoje, todosContatos) {
  const ganhos = contatos.filter((c) => c.etapa === "cliente" && noPeriodo(diaDe(c.ganho_em), filtros));
  const metaDe = new Map(metas.map((m) => [m.mes.slice(0, 7), Number(m.valor)]));
  const mesAtual = hoje.slice(0, 7);

  const porMes = meses(filtros.de, filtros.ate).map((chave) => {
    const doMes = ganhos.filter((c) => diaDe(c.ganho_em).startsWith(chave));
    const total = doMes.reduce((soma, c) => soma + valor.get(c.id), 0);
    const meta = metaDe.get(chave) ?? null;
    const linha = { mes: chave, receita: total, negocios: doMes.length, meta, atingido: meta ? total / meta : null };

    if (chave === mesAtual) {
      const decorridos = Number(hoje.slice(8));
      const noMes = diasNoMes(chave);
      linha.ritmoDia = total / decorridos;
      linha.projecao = (total / decorridos) * noMes;
      linha.faltaPorDia = meta && meta > total ? (meta - total) / Math.max(1, noMes - decorridos) : 0;
      linha.mesDecorrido = decorridos / noMes;
    }
    return linha;
  });

  const porCliente = ganhos
    .map((c) => ({ id: c.id, nome: c.nome, valor: valor.get(c.id), dia: diaDe(c.ganho_em), origem: origemDe(c) }))
    .sort((a, b) => b.valor - a.valor);

  return {
    porMes,
    porCliente,
    total: porCliente.reduce((soma, c) => soma + c.valor, 0),
    meta: porMes.reduce((soma, m) => soma + (m.meta ?? 0), 0),
    // Clientes ganhos antes de o CRM guardar a data do ganho: não têm mês.
    semData: todosContatos.filter((c) => c.etapa === "cliente" && !c.ganho_em).length,
  };
}

// 3. Pipeline aberto: fotografia de agora de todos os negócios nem ganhos nem
// perdidos. Não usa o período — o período acaba hoje e os fechos previstos são
// no futuro: filtrá-los por ele escondia precisamente o que interessa.
function pipeline(contatos, valor, hoje) {
  const abertos = contatos.filter((c) => ETAPAS_ABERTAS.includes(c.etapa));

  const negocios = abertos
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      etapa: c.etapa,
      valor: valor.get(c.id),
      probabilidade: PROBABILIDADE[c.etapa],
      ponderado: valor.get(c.id) * PROBABILIDADE[c.etapa],
      fecho: c.fecho_previsto,
      atrasado: Boolean(c.fecho_previsto && c.fecho_previsto < hoje),
    }))
    // Primeiro os que têm data, do mais próximo ao mais longe; sem data no fim.
    .sort((a, b) => (a.fecho ?? "9999").localeCompare(b.fecho ?? "9999") || b.valor - a.valor);

  const porEtapa = ETAPAS_ABERTAS.map((etapa) => {
    const daEtapa = negocios.filter((n) => n.etapa === etapa);
    return {
      etapa,
      probabilidade: PROBABILIDADE[etapa],
      negocios: daEtapa.length,
      valor: daEtapa.reduce((soma, n) => soma + n.valor, 0),
      ponderado: daEtapa.reduce((soma, n) => soma + n.ponderado, 0),
    };
  });

  return {
    porEtapa,
    negocios,
    valor: porEtapa.reduce((soma, e) => soma + e.valor, 0),
    ponderado: porEtapa.reduce((soma, e) => soma + e.ponderado, 0),
    semData: negocios.filter((n) => !n.fecho).length,
  };
}

// 4. Motivos de perda: negócios perdidos no período, por motivo.
function perdas(contatos, valor, filtros) {
  const perdidos = contatos.filter((c) => c.etapa === "perdido" && noPeriodo(diaDe(c.perdido_em), filtros));
  return {
    total: perdidos.length,
    valor: perdidos.reduce((soma, c) => soma + valor.get(c.id), 0),
    motivos: MOTIVOS_PERDA.map((motivo) => {
      const destes = perdidos.filter((c) => c.motivo_perda === motivo);
      return {
        motivo,
        negocios: destes.length,
        parte: perdidos.length ? destes.length / perdidos.length : 0,
        valor: destes.reduce((soma, c) => soma + valor.get(c.id), 0),
      };
    }).sort((a, b) => b.negocios - a.negocios),
  };
}

// 5. Origem → receita. Por canal: leads que entraram no período, quantos desses
// já são clientes (conversão), e a receita dos negócios ganhos no período.
function origens(contatos, valor, filtros) {
  return [...ORIGENS, SEM_ORIGEM]
    .map((origem) => {
      const doCanal = contatos.filter((c) => origemDe(c) === origem);
      const leads = doCanal.filter((c) => noPeriodo(diaDe(c.criado_em), filtros));
      const convertidos = leads.filter((c) => c.etapa === "cliente").length;
      const ganhos = doCanal.filter((c) => c.etapa === "cliente" && noPeriodo(diaDe(c.ganho_em), filtros));
      const receitaCanal = ganhos.reduce((soma, c) => soma + valor.get(c.id), 0);
      return {
        origem,
        leads: leads.length,
        convertidos,
        conversao: leads.length ? convertidos / leads.length : null,
        ganhos: ganhos.length,
        receita: receitaCanal,
        ticketMedio: ganhos.length ? receitaCanal / ganhos.length : null,
      };
    })
    .filter((linha) => linha.leads || linha.ganhos)
    .sort((a, b) => b.receita - a.receita || b.leads - a.leads);
}
