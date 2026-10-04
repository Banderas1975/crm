"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { criarTarefa } from "./actions";
import { REPETICOES } from "./tarefas";
import { LIMITES } from "../lib/validacao";

export default function NovaTarefa({ contatoId }) {
  const [estado, acao, salvando] = useActionState(criarTarefa, { erro: "" });
  // O dia é acompanhado pelo React (campo controlado). Sem isto, depois de o
  // formulário se limpar, escolher outra vez o mesmo dia não contava como
  // mudança e a hora ficava desativada. Sem dia, hora e repetição nem abrem.
  const [dia, setDia] = useState("");
  const temData = Boolean(dia);

  // A action devolve um contador que sobe a cada tarefa guardada.
  const ultimo = useRef(0);
  useEffect(() => {
    if (estado.salvo && estado.salvo !== ultimo.current) {
      ultimo.current = estado.salvo;
      setDia("");
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
            value={dia}
            onChange={(e) => setDia(e.target.value)}
          />
        </div>

        {/* Com dia, a hora é obrigatória; sem dia, nem aparece ativa. */}
        <div className="campo">
          <label htmlFor="vence_hora">Hora (Lisboa)</label>
          <input id="vence_hora" name="vence_hora" type="time" step={300} required={temData} disabled={!temData} />
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

      {!temData && <p className="ajuda">Para pôr hora ou repetir, marque primeiro uma data.</p>}

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
