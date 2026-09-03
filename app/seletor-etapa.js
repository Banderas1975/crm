"use client";

import { useRef } from "react";
import { mudarEtapa } from "./actions";

const ETAPAS = ["novo", "em contato", "proposta", "cliente"];

export default function SeletorEtapa({ contatoId, etapa, cor }) {
  const formulario = useRef(null);

  return (
    <form action={mudarEtapa} ref={formulario}>
      <input type="hidden" name="contato_id" value={contatoId} />
      <select
        name="etapa"
        aria-label="Etapa do funil"
        className="seletor-etapa"
        style={{ color: cor, borderColor: cor }}
        // key: quando o servidor devolve a etapa nova, o select volta a montar
        // com ela. Sem isto ficava preso no valor que tinha ao carregar a página.
        key={etapa}
        defaultValue={etapa}
        onChange={() => formulario.current.requestSubmit()}
      >
        {ETAPAS.map((nome) => (
          <option key={nome} value={nome}>
            {nome}
          </option>
        ))}
      </select>
    </form>
  );
}
