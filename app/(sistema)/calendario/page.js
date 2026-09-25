import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import Calendario from "../../calendario";
import { exigirSessao } from "../../acesso";
import { hojeEmLisboa, somarDias, inicioDaSemana, emLisboa, deLisboa } from "../../tempo";
import { dataValida } from "../../../lib/validacao";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendário — Meu CRM" };

const VISTAS = { mes: "Mês", semana: "Semana", dia: "Dia" };

// Os dias são rótulos AAAA-MM-DD já escolhidos em Lisboa. Formatá-los em UTC
// mostra exatamente esse dia, sem fuso nenhum pelo meio.
const formatar = (opcoes) => {
  const formato = new Intl.DateTimeFormat("pt-PT", { ...opcoes, timeZone: "UTC" });
  return (iso) => formato.format(new Date(`${iso}T00:00:00Z`));
};
const MES_ANO = formatar({ month: "long", year: "numeric" });
const DIA_MES = formatar({ day: "numeric", month: "long" });
const DIA_LONGO = formatar({ weekday: "long", day: "numeric", month: "long", year: "numeric" });

function ultimoDoMes(iso) {
  const [ano, mes] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes, 0)).toISOString().slice(0, 10);
}

// Dia 1 do mês anterior (-1) ou seguinte (+1).
function mesVizinho(iso, passo) {
  const [ano, mes] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1 + passo, 1)).toISOString().slice(0, 10);
}

export default async function PaginaCalendario({ searchParams }) {
  const eu = await exigirSessao();

  const pedido = await searchParams;
  const vista = pedido.vista in VISTAS ? pedido.vista : "mes";
  const hoje = hojeEmLisboa();
  const dia = typeof pedido.dia === "string" && dataValida(pedido.dia) ? pedido.dia : hoje;

  // Que dias aparecem, e para onde levam as setas.
  let primeiro, ultimo, anterior, seguinte, titulo;
  if (vista === "mes") {
    const dia1 = `${dia.slice(0, 7)}-01`;
    // Semanas inteiras, de segunda a domingo, a cobrir o mês todo.
    primeiro = inicioDaSemana(dia1);
    ultimo = somarDias(inicioDaSemana(ultimoDoMes(dia1)), 6);
    anterior = mesVizinho(dia1, -1);
    seguinte = mesVizinho(dia1, 1);
    titulo = MES_ANO(dia1);
  } else if (vista === "semana") {
    primeiro = inicioDaSemana(dia);
    ultimo = somarDias(primeiro, 6);
    anterior = somarDias(primeiro, -7);
    seguinte = somarDias(primeiro, 7);
    titulo = `${DIA_MES(primeiro)} – ${DIA_MES(ultimo)} de ${ultimo.slice(0, 4)}`;
  } else {
    primeiro = ultimo = dia;
    anterior = somarDias(dia, -1);
    seguinte = somarDias(dia, 1);
    titulo = DIA_LONGO(dia);
  }

  const dias = [];
  for (let d = primeiro; d <= ultimo; d = somarDias(d, 1)) dias.push(d);

  const [{ data: tarefas, error: erroTarefas }, { data: reunioes, error: erroReunioes }] =
    await Promise.all([
      supabase
        .from("tarefas")
        // Com o nome da ligação: desde a v6 há duas entre tarefas e contatos
        // (a simples e a de dono), e sem ele o banco não sabe qual usar.
        .select("id, titulo, vence_em, contato_id, contatos!tarefas_contato_dono(nome)")
        .eq("dono_id", eu.id)
        .is("concluida_em", null)
        .gte("vence_em", primeiro)
        .lte("vence_em", ultimo),
      // Da meia-noite do primeiro dia à meia-noite a seguir ao último, em Lisboa.
      supabase
        .from("reunioes")
        .select("id, titulo, inicio, duracao_min, local, contato_id, contatos!reunioes_contato_fk(nome)")
        .eq("dono_id", eu.id)
        .gte("inicio", deLisboa(primeiro, 0))
        .lt("inicio", deLisboa(somarDias(ultimo, 1), 0))
        .order("inicio", { ascending: true }),
    ]);

  // O navegador recebe tudo já em hora de Lisboa: não faz contas de fuso.
  const listaTarefas = (tarefas ?? []).map((t) => ({
    id: t.id,
    titulo: t.titulo,
    dia: t.vence_em,
    contatoId: t.contato_id,
    nome: t.contatos?.nome ?? "",
  }));

  const listaReunioes = (reunioes ?? []).map((r) => ({
    id: r.id,
    titulo: r.titulo,
    ...emLisboa(r.inicio),
    duracao: r.duracao_min,
    local: r.local,
    contatoId: r.contato_id,
    nome: r.contatos?.nome ?? "",
  }));

  // "setembro de 2026" → "Setembro de 2026": só a primeira letra.
  titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1);

  const endereco = (v, d) => `/calendario?vista=${v}&dia=${d}`;

  return (
    <>
      <header className="cabecalho">
        <h1>Calendário</h1>
        <p className="apoio">Tarefas e reuniões, em hora de Lisboa.</p>
      </header>

      {(erroTarefas || erroReunioes) && (
        <p className="erro">Não foi possível carregar o calendário.</p>
      )}

      <div className="cal-barra">
        <div className="cal-nav">
          <Link className="botao-contorno" href={endereco(vista, anterior)} aria-label="Anterior">
            ‹
          </Link>
          <Link className="botao-contorno" href={endereco(vista, hoje)}>
            Hoje
          </Link>
          <Link className="botao-contorno" href={endereco(vista, seguinte)} aria-label="Seguinte">
            ›
          </Link>
          <h2 className="cal-titulo">{titulo}</h2>
        </div>

        <nav className="cal-vistas" aria-label="Vista">
          {Object.entries(VISTAS).map(([chave, nome]) => (
            <Link
              key={chave}
              href={endereco(chave, dia)}
              className={chave === vista ? "cal-vista ativa" : "cal-vista"}
              aria-current={chave === vista ? "page" : undefined}
            >
              {nome}
            </Link>
          ))}
        </nav>
      </div>

      <Calendario
        vista={vista}
        dias={dias}
        mes={vista === "mes" ? dia.slice(0, 7) : null}
        hoje={hoje}
        tarefas={listaTarefas}
        reunioes={listaReunioes}
      />
    </>
  );
}
