import Link from "next/link";
import { supabase } from "../../../../lib/supabase";
import Anotacao from "../../../anotacao";
import Copiar from "../../../copiar";
import EtapaContato from "../../../etapa-contato";
import FollowUp from "../../../follow-up";
import { salvarAnotacao } from "../../../actions";
import { exigirSessao } from "../../../sessao-actions";
import { haQuantoTempo, FORMATO_DATA } from "../../../tempo";
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

  const notas = anotacoes ?? [];
  const mensagens = followUps ?? [];

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
