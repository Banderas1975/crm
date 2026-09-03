"use client";

import { useState } from "react";
import { editarAnotacao, excluirAnotacao } from "./actions";
import { LIMITES } from "../lib/validacao";

// Uma anotação da lista: mostra o texto, ou o formulário de edição.
// A data já vem formatada do servidor.
export default function Anotacao({ nota, data }) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <li>
        <form
          action={async (dados) => {
            await editarAnotacao(dados);
            setEditando(false);
          }}
        >
          <input type="hidden" name="id" value={nota.id} />
          <textarea name="texto" rows={3} required maxLength={LIMITES.anotacao} defaultValue={nota.texto} />
          <div className="acoes-nota">
            <button className="botao botao-pequeno">Guardar</button>
            <button type="button" className="botao-texto" onClick={() => setEditando(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li>
      <div className="nota-topo">
        <p className="data">{data}</p>
        <div className="acoes-nota">
          <button type="button" className="botao-texto" onClick={() => setEditando(true)}>
            Editar
          </button>
          <form
            action={excluirAnotacao}
            onSubmit={(e) => {
              if (!confirm("Excluir esta anotação? Não dá para desfazer.")) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={nota.id} />
            <button className="botao-texto botao-excluir">Excluir</button>
          </form>
        </div>
      </div>
      <p>{nota.texto}</p>
    </li>
  );
}
