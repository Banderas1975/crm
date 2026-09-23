"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { criarTarefa } from "./actions";
import { REPETICOES } from "./tarefas";
import { LIMITES } from "../lib/validacao";

export default function NovaTarefa({ contatoId }) {
  const [estado, acao, salvando] = useActionState(criarTarefa, { erro: "" });
  // Repetir sem data não vale: o servidor recusa, e aqui o campo nem abre.
  const [temData, setTemData] = useState(false);

  // A action devolve um contador que sobe a cada tarefa guardada.
  const ultimo = useRef(0);
  useEffect(() => {
    if (estado.salvo && estado.salvo !== ultimo.current) {
      ultimo.current = estado.salvo;
      setTemData(false);
    }
  }, [estado.salvo]);

  return (
    <form action={acao} className="nova-tarefa">
      <input type="hidden" name="contato_id" value={contatoId} />

      <div className="campo">
        <label htmlFor="titulo">O que é para fazer</label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          required
          maxLength={LIMITES.tarefa}
          autoComplete="off"
          placeholder="Ligar para confirmar a proposta"
        />
      </div>

      <div className="tarefa-campos">
        <div className="campo">
          <label htmlFor="vence_em">Para quando (opcional)</label>
          <input
            id="vence_em"
            name="vence_em"
            type="date"
            onChange={(e) => setTemData(Boolean(e.target.value))}
          />
        </div>

        <div className="campo">
          <label htmlFor="repete">Repete</label>
          <select id="repete" name="repete" defaultValue="" disabled={!temData}>
            <option value="">não repete</option>
            {Object.entries(REPETICOES).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!temData && <p className="ajuda">Para repetir, marque primeiro uma data.</p>}

      {estado.erro && (
        <p className="erro" aria-live="polite">
          {estado.erro}
        </p>
      )}

      <button className="botao botao-pequeno" disabled={salvando}>
        {salvando ? "A guardar..." : "Adicionar tarefa"}
      </button>
    </form>
  );
}
