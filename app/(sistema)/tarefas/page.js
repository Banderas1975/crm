import { supabase } from "../../../lib/supabase";
import TarefaItem from "../../tarefa-item";
import { exigirSessao } from "../../sessao-actions";
import { hojeEmLisboa, fimDaSemana, formatarDia } from "../../tempo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tarefas — Meu CRM" };

export default async function Tarefas() {
  await exigirSessao();

  const hoje = hojeEmLisboa();
  const domingo = fimDaSemana(hoje);

  const { data: tarefas, error } = await supabase
    .from("tarefas")
    .select("id, titulo, vence_em, repete, contato_id, contatos(nome)")
    .is("concluida_em", null)
    .order("vence_em", { ascending: true });

  const lista = (tarefas ?? []).map((tarefa) => ({
    ...tarefa,
    dia: tarefa.vence_em ? formatarDia(tarefa.vence_em) : null,
  }));

  // As datas são texto AAAA-MM-DD, por isso comparam-se como texto e não há
  // contas de fuso nenhumas: o "hoje" já veio calculado em Lisboa.
  const secoes = [
    {
      nome: "Atrasadas",
      vazio: "Nada atrasado. Bom sinal.",
      itens: lista.filter((t) => t.vence_em && t.vence_em < hoje),
    },
    {
      nome: "Hoje",
      vazio: "Nada para hoje.",
      itens: lista.filter((t) => t.vence_em === hoje),
    },
    {
      nome: "Esta semana",
      vazio: "Nada até domingo.",
      itens: lista.filter((t) => t.vence_em > hoje && t.vence_em <= domingo),
    },
    {
      nome: "Sem data",
      vazio: "Nenhuma tarefa solta.",
      itens: lista.filter((t) => !t.vence_em),
    },
  ];

  return (
    <>
      <header className="cabecalho">
        <h1>Tarefas</h1>
        <p className="apoio">O que tem de ser feito, e com quem.</p>
      </header>

      {error && <p className="erro">Não foi possível carregar as tarefas.</p>}

      {secoes.map((secao) => (
        <section key={secao.nome} className="cartao">
          <h2 className="titulo-secao">
            {secao.nome}{" "}
            {secao.itens.length > 0 && <span className="mono">({secao.itens.length})</span>}
          </h2>

          {secao.itens.length === 0 ? (
            <p className="apoio">{secao.vazio}</p>
          ) : (
            <ul className="tarefas">
              {secao.itens.map((tarefa) => (
                <TarefaItem key={tarefa.id} tarefa={tarefa} mostrarContato />
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}
