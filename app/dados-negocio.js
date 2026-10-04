"use client";

import { useActionState } from "react";
import { guardarNegocio } from "./actions";
import { ORIGENS } from "./etapas";

// Origem e data de fecho prevista: o que alimenta os relatórios de origem e de pipeline.
export default function DadosNegocio({ contatoId, origem, fechoPrevisto }) {
  const [estado, acao, guardando] = useActionState(guardarNegocio, { erro: "" });

  return (
    <form action={acao} className="dados-negocio">
      <input type="hidden" name="contato_id" value={contatoId} />

      <div className="campo">
        <label htmlFor="origem">Origem</label>
        <select id="origem" name="origem" defaultValue={origem ?? ""}>
          <option value="">Sem origem</option>
          {ORIGENS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div className="campo">
        <label htmlFor="fecho_previsto">Fecho previsto</label>
        <input id="fecho_previsto" name="fecho_previsto" type="date" defaultValue={fechoPrevisto ?? ""} />
      </div>

      <button className="botao botao-pequeno" disabled={guardando}>
        {guardando ? "A guardar..." : "Guardar"}
      </button>

      {estado.erro && (
        <p className="erro" aria-live="polite">
          {estado.erro}
        </p>
      )}
      {!guardando && estado.salvo > 0 && !estado.erro && (
        <p className="ajuda" aria-live="polite">
          Guardado.
        </p>
      )}
    </form>
  );
}
