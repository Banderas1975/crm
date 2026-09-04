"use client";

import { useActionState } from "react";
import { gerarFollowUp } from "./actions";

// Só o botão: a mensagem escrita fica guardada no banco e aparece
// na lista logo abaixo, sem precisar de a mostrar aqui também.
export default function FollowUp({ contatoId }) {
  const [estado, acao, gerando] = useActionState(gerarFollowUp, { erro: "" });

  return (
    <div className="follow-up">
      <form action={acao}>
        <input type="hidden" name="contato_id" value={contatoId} />
        <button className="botao botao-pequeno" disabled={gerando}>
          {gerando ? "A escrever..." : "Gerar follow-up"}
        </button>
      </form>

      {gerando && (
        <p className="apoio" aria-live="polite">
          A IA está a escrever a mensagem...
        </p>
      )}

      {!gerando && estado.erro && (
        <p className="erro" aria-live="polite">
          {estado.erro}
        </p>
      )}
    </div>
  );
}
