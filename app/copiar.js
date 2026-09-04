"use client";

import { useState } from "react";

export default function Copiar({ texto }) {
  // null = por copiar, true = copiado, false = falhou
  const [copiado, setCopiado] = useState(null);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      // Alguns navegadores recusam a cópia automática. Melhor dizer do que
      // deixar o botão mudo, sem o utilizador perceber que não copiou.
      setCopiado(false);
    }
    setTimeout(() => setCopiado(null), 2500);
  }

  return (
    <button type="button" className="botao-texto" onClick={copiar}>
      {copiado === true && "Copiado"}
      {copiado === false && "Não deu para copiar — selecione o texto acima"}
      {copiado === null && "Copiar"}
    </button>
  );
}
