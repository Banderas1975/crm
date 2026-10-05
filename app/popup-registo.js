"use client";

import { useEffect, useRef } from "react";

// Aparece por cima do login logo a seguir ao registo. Usa as cores da landing
// page (exceção registada no design.md). Janela nativa (<dialog>): fecha no Esc.
export default function PopupRegisto() {
  const janela = useRef(null);

  useEffect(() => {
    janela.current.showModal();
    // Tira o "?registado=1" do endereço: recarregar a página não volta a abrir o pop-up.
    window.history.replaceState(null, "", "/login");
  }, []);

  const fechar = () => janela.current.close();

  return (
    <dialog className="popup-registo" ref={janela} aria-labelledby="popup-registo-titulo">
      <button className="popup-registo-x" onClick={fechar} aria-label="Fechar">
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      </button>

      <svg className="popup-registo-icone" viewBox="0 0 64 64" width="96" height="96" aria-hidden="true">
        <circle cx="32" cy="32" r="29" />
        <path d="M22 33l7 7 14-15" />
      </svg>

      <h2 id="popup-registo-titulo">
        Entraremos em contacto <em>muito brevemente</em>
      </h2>

      <button className="popup-registo-botao" onClick={fechar} autoFocus>
        Fechar
      </button>
    </dialog>
  );
}
