import Link from "next/link";
import { supabase } from "../../../../lib/supabase";
import Anotacao from "../../../anotacao";
import Copiar from "../../../copiar";
import EtapaContato from "../../../etapa-contato";
import FollowUp from "../../../follow-up";
import NovaTarefa from "../../../nova-tarefa";
import TarefaItem from "../../../tarefa-item";
import { salvarAnotacao } from "../../../actions";
import { exigirSessao } from "../../../sessao-actions";
import { haQuantoTempo, FORMATO_DATA, formatarDia } from "../../../tempo";
import { LIMITES, idValido } from "../../../../lib/validacao";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contato — Meu CRM" };

export default async function PaginaContato({ params }) {
  await exigirSessao();

  const { id: idCru } = await params;
  const id = Number(idCru);

  const { data: contato } = idValido(id)
    ? await supabase
        .from("contatos")
        .select("id, nome, email, telefone, etapa, criado_em")
        .eq("id", id)
        .single()
    : { data: null };

  if (!contato) {
    return (
      <>
        <header className="cabecalho">
          <h1>Contato não encontrado</h1>
          <p className="apoio">
            Este contato já não existe. Pode ter sido apagado entretanto.
          </p>
        </header>
        <p>
          <Link href="/funil">Voltar ao funil</Link>
        </p>
      </>
    );
  }

  const { data: anotacoes } = await supabase
    .from("anotacoes")
    .select("id, texto, criado_em")
    .eq("contato_id", id)
    .order("criado_em", { ascending: false });

  const { data: followUps } = await supabase
    .from("follow_ups")
    .select("id, texto, criado_em")
    .eq("contato_id", id)
    .order("criado_em", { ascending: false });

  const { data: tarefas } = await supabase
    .from("tarefas")
    .select("id, titulo, vence_em, repete, concluida_em")
    .eq("contato_id", id)
    .order("vence_em", { ascending: true });

  const notas = anotacoes ?? [];
  const mensagens = followUps ?? [];

  const porFazer = (tarefas ?? [])
    .filter((tarefa) => !tarefa.concluida_em)
    .map((tarefa) => ({
      ...tarefa,
      dia: tarefa.vence_em ? formatarDia(tarefa.vence_em) : null,
    }));

  // O histórico do que já foi feito por este cliente, do mais recente para trás.
  const feitas = (tarefas ?? [])
    .filter((tarefa) => tarefa.concluida_em)
    .sort((a, b) => b.concluida_em.localeCompare(a.concluida_em));

  return (
    <>
      <header className="cabecalho">
        <h1>{contato.nome}</h1>
        <p className="apoio mono">
          {[contato.email, contato.telefone].filter(Boolean).join(" · ") ||
            "Sem email nem telefone"}
        </p>
      </header>

      <section className="cartao ficha">
        <div className="ficha-etapa">
          <p className="ficha-rotulo">Etapa</p>
          <EtapaContato contatoId={contato.id} etapa={contato.etapa} />
        </div>
        <div>
          <p className="ficha-rotulo">Seu contato</p>
          <p className="ficha-valor mono">{haQuantoTempo(contato.criado_em)}</p>
        </div>
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">
          Tarefas {porFazer.length > 0 && <span className="mono">({porFazer.length})</span>}
        </h2>

        {porFazer.length === 0 ? (
          <p className="apoio">Nenhuma tarefa por fazer.</p>
        ) : (
          <ul className="tarefas">
            {porFazer.map((tarefa) => (
              <TarefaItem key={tarefa.id} tarefa={tarefa} />
            ))}
          </ul>
        )}

        <NovaTarefa contatoId={contato.id} />

        {feitas.length > 0 && (
          <details className="feitas">
            <summary>
              Já feitas <span className="mono">({feitas.length})</span>
            </summary>
            <ul className="tarefas">
              {feitas.map((tarefa) => (
                <li key={tarefa.id} className="tarefa feita">
                  <span className="tarefa-marca marcada" aria-hidden="true" />
                  <div className="tarefa-texto">
                    <p className="tarefa-titulo">{tarefa.titulo}</p>
                    <p className="tarefa-detalhes mono">
                      {FORMATO_DATA.format(new Date(tarefa.concluida_em))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">
          Anotações {notas.length > 0 && <span className="mono">({notas.length})</span>}
        </h2>

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
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">
          Follow-ups {mensagens.length > 0 && <span className="mono">({mensagens.length})</span>}
        </h2>

        <FollowUp contatoId={contato.id} />

        {mensagens.length === 0 ? (
          <p className="apoio">Nenhum follow-up gerado ainda.</p>
        ) : (
          <ul className="notas">
            {mensagens.map((mensagem) => (
              <li key={mensagem.id}>
                <p className="data">{FORMATO_DATA.format(new Date(mensagem.criado_em))}</p>
                <p className="texto-ia">{mensagem.texto}</p>
                <Copiar texto={mensagem.texto} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
