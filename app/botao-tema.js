"use client";

import { useState } from "react";

// Alterna entre o tema escuro (o padrão) e o claro. A escolha fica num cookie,
// para o servidor já desenhar a página no tema certo da próxima vez — sem a
// página piscar no tema errado antes de mudar.
export default function BotaoTema({ inicial }) {
  const [tema, setTema] = useState(inicial);
  const claro = tema === "claro";

  function alternar() {
    const novo = claro ? "escuro" : "claro";
    setTema(novo);
    if (novo === "claro") document.documentElement.dataset.tema = "claro";
    else delete document.documentElement.dataset.tema;
    const seguro = location.protocol === "https:" ? "; secure" : "";
    document.cookie = `tema=${novo}; path=/; max-age=31536000; samesite=lax${seguro}`;
  }

  return (
    <button
      type="button"
      className="botao-tema"
      onClick={alternar}
      title={claro ? "Mudar para o tema escuro" : "Mudar para o tema claro"}
      aria-label={claro ? "Mudar para o tema escuro" : "Mudar para o tema claro"}
    >
      {claro ? (
        // lua
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      ) : (
        // sol
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      <span className="botao-tema-texto">{claro ? "Escuro" : "Claro"}</span>
    </button>
  );
}
