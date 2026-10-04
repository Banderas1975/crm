"use client";

import { useActionState } from "react";
import { guardarMeta } from "./actions";
import { hojeEmLisboa } from "./tempo";

// Meta de receita de um mês. Voltar a gravar o mesmo mês troca o valor.
export default function NovaMeta() {
  const [estado, acao, guardando] = useActionState(guardarMeta, { erro: "" });

  return (
    <form action={acao} className="rel-filtros rel-meta-form">
      <div className="campo">
        <label htmlFor="meta-mes">Meta do mês</label>
        <input id="meta-mes" name="mes" type="month" required defaultValue={hojeEmLisboa().slice(0, 7)} />
      </div>
      <div className="campo">
        <label htmlFor="meta-valor">Valor (€)</label>
        <input id="meta-valor" name="valor" type="text" inputMode="decimal" required placeholder="20000" autoComplete="off" />
      </div>
      <button className="botao botao-pequeno" disabled={guardando}>
        {guardando ? "A guardar..." : "Guardar meta"}
      </button>
      {estado.erro && (
        <p className="erro" aria-live="polite">
          {estado.erro}
        </p>
      )}
    </form>
  );
}
