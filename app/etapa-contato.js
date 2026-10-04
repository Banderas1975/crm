"use client";

import { useOptimistic, useState, useTransition } from "react";
import { mudarEtapa } from "./actions";
import { ETAPAS, CORES_ETAPA } from "./etapas";
import { usarMotivoPerda } from "./motivo-perda";

// Trocar a etapa aqui grava já e, pelo revalidate da action,
// o Kanban e o Dashboard passam a mostrar a etapa nova.
export default function EtapaContato({ contatoId, nome, etapa }) {
  const [erro, setErro] = useState("");
  const [, comecar] = useTransition();
  const [atual, aplicarJa] = useOptimistic(etapa);
  const [pedirMotivo, janelaMotivo] = usarMotivoPerda();

  async function mudar(nova) {
    if (nova === atual) return;
    // Perder pede sempre o motivo. Cancelar deixa a etapa como estava.
    const motivo = nova === "perdido" ? await pedirMotivo(nome) : null;
    if (nova === "perdido" && !motivo) return;

    setErro("");
    comecar(async () => {
      aplicarJa(nova);
      const { ok } = await mudarEtapa(contatoId, nova, motivo);
      if (!ok) setErro("Não foi possível mudar a etapa.");
    });
  }

  return (
    <>
      {janelaMotivo}
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
