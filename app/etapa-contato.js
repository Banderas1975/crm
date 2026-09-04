"use client";

import { useOptimistic, useState, useTransition } from "react";
import { mudarEtapa } from "./actions";
import { ETAPAS, CORES_ETAPA } from "./etapas";

// Trocar a etapa aqui grava já e, pelo revalidate da action,
// o Kanban e o Dashboard passam a mostrar a etapa nova.
export default function EtapaContato({ contatoId, etapa }) {
  const [erro, setErro] = useState("");
  const [, comecar] = useTransition();
  const [atual, aplicarJa] = useOptimistic(etapa);

  function mudar(nova) {
    if (nova === atual) return;
    setErro("");
    comecar(async () => {
      aplicarJa(nova);
      const { ok } = await mudarEtapa(contatoId, nova);
      if (!ok) setErro("Não foi possível mudar a etapa.");
    });
  }

  return (
    <>
      <select
        className="seletor-etapa"
        aria-label="Etapa do funil"
        style={{ color: CORES_ETAPA[atual], borderColor: CORES_ETAPA[atual] }}
        value={atual}
        onChange={(e) => mudar(e.target.value)}
      >
        {ETAPAS.map((nome) => (
          <option key={nome} value={nome}>
            {nome}
          </option>
        ))}
      </select>

      {erro && (
        <p className="erro" aria-live="polite">
          {erro}
        </p>
      )}
    </>
  );
}
