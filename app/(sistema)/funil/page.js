import { supabase } from "../../../lib/supabase";
import Kanban from "../../kanban";
import NovoContato from "../../novo-contato";
import { exigirSessao } from "../../sessao-actions";
import { haQuantoTempo } from "../../tempo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Funil — Meu CRM" };

export default async function Funil() {
  await exigirSessao();

  const { data: contatos, error } = await supabase
    .from("contatos")
    .select("id, nome, email, etapa, criado_em")
    .order("criado_em", { ascending: false });

  return (
    <>
      <header className="topo-area">
        <div className="cabecalho">
          <h1>Funil</h1>
          <p className="apoio">Arraste um contato para mudar a etapa dele.</p>
        </div>
        <NovoContato />
      </header>

      {error ? (
        <p className="erro">Não foi possível carregar os contatos.</p>
      ) : (
        <Kanban
          contatos={contatos.map((contato) => ({
            ...contato,
            tempo: haQuantoTempo(contato.criado_em),
          }))}
        />
      )}
    </>
  );
}
