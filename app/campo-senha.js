"use client";

import { useState } from "react";

// Campo de senha com botão para ver o que se escreveu. Começa sempre escondido:
// quem está ao lado não vê nada sem a pessoa pedir.
export default function CampoSenha({ id, name, maxLength, autoComplete }) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="campo-senha">
      <input
        id={id}
        name={name}
        type={visivel ? "text" : "password"}
        required
        maxLength={maxLength}
        autoComplete={autoComplete}
        // Sem correções nem maiúsculas automáticas quando a senha está à vista.
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      <button
        type="button"
        className="botao-texto"
        onClick={() => setVisivel((v) => !v)}
        aria-controls={id}
        aria-pressed={visivel}
      >
        {visivel ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
