"use client";

import { useRef } from "react";
import Formulario from "./formulario";

// Botão + janela nativa do navegador (<dialog>): fecha no Esc e escurece
// o fundo sozinha, sem biblioteca nenhuma.
export default function NovoContato() {
  const janela = useRef(null);

  return (
    <>
      <button className="botao" onClick={() => janela.current.showModal()}>
        Novo contato
      </button>

      <dialog className="janela" ref={janela}>
        <div className="janela-topo">
          <h2 className="titulo-secao">Novo contato</h2>
          <button className="botao-texto" onClick={() => janela.current.close()}>
            Fechar
          </button>
        </div>

        <Formulario aoSalvar={() => janela.current.close()} />
      </dialog>
    </>
  );
}
