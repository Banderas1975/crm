"use client";

import { useRef, useState } from "react";
import { MOTIVOS_PERDA } from "./etapas";

// Pergunta o motivo antes de um negócio passar a "perdido". Devolve
// [pedir, janela]: pedir(nome) abre a janela e resolve com o motivo escolhido,
// ou com null se a pessoa cancelar (Esc, Cancelar). A janela tem de ser posta na página.
export function usarMotivoPerda() {
  const janela = useRef(null);
  const resolver = useRef(null);
  const [nome, setNome] = useState("");

  function pedir(nomeContato) {
    setNome(nomeContato);
    janela.current.showModal();
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }

  // Responde uma vez só: fechar a janela também dispara o onClose.
  function responder(motivo) {
    const resolve = resolver.current;
    resolver.current = null;
    if (janela.current?.open) janela.current.close();
    resolve?.(motivo);
  }

  const elemento = (
    <dialog ref={janela} className="janela" onClose={() => responder(null)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          responder(new FormData(e.currentTarget).get("motivo"));
          e.currentTarget.reset();
        }}
      >
        <h2 className="titulo-secao">Porque se perdeu{nome ? ` ${nome}` : ""}?</h2>
        <div className="campo">
          <label htmlFor="motivo-perda">Motivo</label>
          <select id="motivo-perda" name="motivo" required defaultValue="">
            <option value="" disabled>
              Escolha o motivo
            </option>
            {MOTIVOS_PERDA.map((motivo) => (
              <option key={motivo} value={motivo}>
                {motivo}
              </option>
            ))}
          </select>
        </div>
        <div className="acoes-janela">
          <button className="botao">Marcar como perdido</button>
          <button type="button" className="botao-texto" onClick={() => responder(null)}>
            Cancelar
          </button>
        </div>
      </form>
    </dialog>
  );

  return [pedir, elemento];
}
