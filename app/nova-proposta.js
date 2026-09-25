"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { anexarProposta } from "./actions";
import { TAMANHO_MAX_PROPOSTA } from "../lib/validacao";

export default function NovaProposta({ contatoId }) {
  const [estado, acao, enviando] = useActionState(anexarProposta, { erro: "" });
  const [erroLocal, setErroLocal] = useState("");
  const formulario = useRef(null);

  // A action devolve um contador que sobe a cada proposta guardada.
  const ultimo = useRef(0);
  useEffect(() => {
    if (estado.salvo && estado.salvo !== ultimo.current) {
      ultimo.current = estado.salvo;
      formulario.current?.reset();
    }
  }, [estado.salvo]);

  // Avisa já aqui, antes de enviar 4,5 MB para nada. O servidor volta a conferir.
  function conferirTamanho(e) {
    const ficheiro = e.target.files?.[0];
    if (ficheiro && ficheiro.size > TAMANHO_MAX_PROPOSTA) {
      e.target.value = "";
      setErroLocal("A proposta é grande demais (máximo 4,5 MB).");
    } else {
      setErroLocal("");
    }
  }

  const erro = erroLocal || estado.erro;

  return (
    <form action={acao} ref={formulario} className="nova-tarefa">
      <input type="hidden" name="contato_id" value={contatoId} />

      <div className="tarefa-campos">
        <div className="campo">
          <label htmlFor="ficheiro">Ficheiro</label>
          <input
            id="ficheiro"
            name="ficheiro"
            type="file"
            required
            accept=".pdf,.docx,.xlsx"
            onChange={conferirTamanho}
          />
        </div>

        <div className="campo">
          <label htmlFor="valor">Valor da proposta (€)</label>
          <input
            id="valor"
            name="valor"
            type="text"
            inputMode="decimal"
            required
            autoComplete="off"
            placeholder="12500,00"
          />
        </div>
      </div>

      <p className="ajuda">PDF, DOCX ou XLSX, até 4,5 MB. As propostas anteriores ficam guardadas.</p>

      {erro && (
        <p className="erro" aria-live="polite">
          {erro}
        </p>
      )}

      <button className="botao botao-pequeno" disabled={enviando}>
        {enviando ? "A enviar..." : "Anexar proposta"}
      </button>
    </form>
  );
}
