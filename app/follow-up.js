"use client";

import { useActionState, useState } from "react";
import { gerarFollowUp } from "./actions";

export default function FollowUp({ contatoId }) {
  const [estado, acao, gerando] = useActionState(gerarFollowUp, {});
  // null = por copiar, true = copiado, false = falhou
  const [copiado, setCopiado] = useState(null);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(estado.mensagem);
      setCopiado(true);
    } catch {
      // Alguns navegadores recusam a cópia automática. Melhor dizer do que
      // deixar o botão mudo, sem o utilizador perceber que não copiou.
      setCopiado(false);
    }
    setTimeout(() => setCopiado(null), 2500);
  }

  return (
    <div className="follow-up">
      <form action={acao}>
        <input type="hidden" name="contato_id" value={contatoId} />
        <button className="botao-texto" disabled={gerando}>
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

      {!gerando && estado.mensagem && (
        <div className="mensagem-ia">
          <p>{estado.mensagem}</p>
          <button type="button" className="botao-texto" onClick={copiar}>
            {copiado === true && "Copiado"}
            {copiado === false && "Não deu para copiar — selecione o texto acima"}
            {copiado === null && "Copiar mensagem"}
          </button>
        </div>
      )}
    </div>
  );
}
