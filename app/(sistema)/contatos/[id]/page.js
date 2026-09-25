import Link from "next/link";
import { supabase } from "../../../../lib/supabase";
import Anotacao from "../../../anotacao";
import Copiar from "../../../copiar";
import EtapaContato from "../../../etapa-contato";
import FollowUp from "../../../follow-up";
import NovaProposta from "../../../nova-proposta";
import NovaReuniao from "../../../nova-reuniao";
import NovaTarefa from "../../../nova-tarefa";
import TarefaItem from "../../../tarefa-item";
import { salvarAnotacao, marcarGanho } from "../../../actions";
import { exigirSessao } from "../../../acesso";
import {
  haQuantoTempo,
  FORMATO_DATA,
  formatarDia,
  emLisboa,
  formatarHora,
} from "../../../tempo";
import { LIMITES, idValido } from "../../../../lib/validacao";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contato — Meu CRM" };

const EUROS = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

const DIA_REUNIAO = new Intl.DateTimeFormat("pt-PT", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Lisbon",
});

const tamanho = (bytes) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;

export default async function PaginaContato({ params }) {
  const eu = await exigirSessao();

  const { id: idCru } = await params;
  const id = Number(idCru);

  const { data: contato } = idValido(id)
    ? await supabase
        .from("contatos")
        .select("id, nome, email, telefone, etapa, criado_em, proposta_ganha_id")
        .eq("id", id)
        // De outro utilizador é como se não existisse: a mesma resposta, sem pistas.
        .eq("dono_id", eu.id)
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
    .eq("dono_id", eu.id)
    .order("criado_em", { ascending: false });

  const { data: followUps } = await supabase
    .from("follow_ups")
    .select("id, texto, criado_em")
    .eq("contato_id", id)
    .eq("dono_id", eu.id)
    .order("criado_em", { ascending: false });

  const { data: tarefas } = await supabase
    .from("tarefas")
    .select("id, titulo, vence_em, repete, concluida_em")
    .eq("contato_id", id)
    .eq("dono_id", eu.id)
    .order("vence_em", { ascending: true });

  const { data: propostas } = await supabase
    .from("propostas")
    .select("id, nome, tamanho, valor, criado_em")
    .eq("contato_id", id)
    .eq("dono_id", eu.id)
    .order("criado_em", { ascending: false });

  const listaPropostas = propostas ?? [];

  // Reuniões deste contato: as que são dele e aquelas em que é só participante.
  const { data: comoParticipante } = await supabase
    .from("reuniao_contatos")
    .select("reuniao_id")
    .eq("contato_id", id)
    .eq("dono_id", eu.id);
  const outrasIds = (comoParticipante ?? []).map((r) => r.reuniao_id);

  const { data: reunioes } = await supabase
    .from("reunioes")
    .select(
      "id, titulo, inicio, duracao_min, local, contato_id, contatos!reunioes_contato_fk(nome), reuniao_contatos(contatos(id, nome)), reuniao_usuarios(usuarios(email))"
    )
    .eq("dono_id", eu.id)
    .or(outrasIds.length ? `contato_id.eq.${id},id.in.(${outrasIds.join(",")})` : `contato_id.eq.${id}`)
    .order("inicio", { ascending: true });

  const agora = Date.now();
  const listaReunioes = (reunioes ?? []).map((r) => {
    const { minutos } = emLisboa(r.inicio);
    return {
      ...r,
      quando: `${DIA_REUNIAO.format(new Date(r.inicio))} · ${formatarHora(minutos)}–${formatarHora(minutos + r.duracao_min)}`,
      participantes: [
        r.contatos?.nome,
        ...r.reuniao_contatos.map((p) => p.contatos?.nome),
        ...r.reuniao_usuarios.map((p) => p.usuarios?.email),
      ].filter(Boolean),
      acabou: new Date(r.inicio).getTime() + r.duracao_min * 60000 < agora,
    };
  });
  const proximas = listaReunioes.filter((r) => !r.acabou);
  const passadas = listaReunioes.filter((r) => r.acabou).reverse();

  // Quem pode ser escolhido como participante.
  const { data: outrosContatos } = await supabase
    .from("contatos")
    .select("id, nome")
    .eq("dono_id", eu.id)
    .neq("id", id)
    .order("nome", { ascending: true });

  const { data: equipa } = await supabase
    .from("usuarios")
    .select("id, email")
    .eq("estado", "aprovado")
    .order("email", { ascending: true });
  const ganha = listaPropostas.find((proposta) => proposta.id === contato.proposta_ganha_id);

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


  const itemReuniao = (reuniao) => (
    <li key={reuniao.id} className={reuniao.acabou ? "tarefa feita" : "tarefa"}>
      <div className="tarefa-texto">
        <p className="tarefa-titulo">{reuniao.titulo}</p>
        <p className="tarefa-detalhes mono">
          {reuniao.quando} · {reuniao.duracao_min} min
        </p>
        {reuniao.local && <p className="reuniao-local">Local: {reuniao.local}</p>}
        <p className="reuniao-participantes">Participantes: {reuniao.participantes.join(", ")}</p>
        {reuniao.contato_id !== contato.id && (
          <p className="reuniao-participantes">
            Marcada em <Link href={`/contatos/${reuniao.contato_id}`}>{reuniao.contatos?.nome}</Link>
          </p>
        )}
      </div>
    </li>
  );

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
        {ganha && (
          <div>
            <p className="ficha-rotulo">Ganho</p>
            <p className="ficha-valor mono">{EUROS.format(ganha.valor)}</p>
          </div>
        )}
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
          Reuniões {proximas.length > 0 && <span className="mono">({proximas.length})</span>}
        </h2>

        {proximas.length === 0 ? (
          <p className="apoio">Nenhuma reunião marcada.</p>
        ) : (
          <ul className="tarefas">{proximas.map(itemReuniao)}</ul>
        )}

        <NovaReuniao
          contatoId={contato.id}
          nome={contato.nome}
          contatos={outrosContatos ?? []}
          usuarios={equipa ?? []}
        />

        {passadas.length > 0 && (
          <details className="feitas">
            <summary>
              Já realizadas <span className="mono">({passadas.length})</span>
            </summary>
            <ul className="tarefas">{passadas.map(itemReuniao)}</ul>
          </details>
        )}
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">
          Propostas{" "}
          {listaPropostas.length > 0 && <span className="mono">({listaPropostas.length})</span>}
        </h2>

        {listaPropostas.length === 0 ? (
          <p className="apoio">Nenhuma proposta anexada.</p>
        ) : (
          <ul className="tarefas">
            {listaPropostas.map((proposta) => (
              <li key={proposta.id} className="tarefa proposta">
                <div className="tarefa-texto">
                  <p className="tarefa-titulo">
                    <a href={`/propostas/${proposta.id}`}>{proposta.nome}</a>
                  </p>
                  <p className="tarefa-detalhes mono">
                    {EUROS.format(proposta.valor)} · {tamanho(proposta.tamanho)} ·{" "}
                    {FORMATO_DATA.format(new Date(proposta.criado_em))}
                  </p>
                </div>

                {proposta.id === contato.proposta_ganha_id ? (
                  <span className="etiqueta etiqueta-ganha mono">ganha</span>
                ) : (
                  <form action={marcarGanho}>
                    <input type="hidden" name="id" value={proposta.id} />
                    <button className="botao-texto">Marcar como ganho</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}

        <NovaProposta contatoId={contato.id} />
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
