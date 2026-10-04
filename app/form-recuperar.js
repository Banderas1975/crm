"use client";

import { useActionState } from "react";
import { pedirRecuperacao } from "./recuperar-actions";
import { LIMITES } from "../lib/validacao";

export default function FormRecuperar() {
  const [estado, acao, aEnviar] = useActionState(pedirRecuperacao, { erro: "" });

  // Depois de pedir, a mesma mensagem para todos — exista a conta ou não.
  if (estado.enviado) {
    return (
      <p className="aviso" aria-live="polite">
        Se existir uma conta aprovada com esse email, enviámos-lhe um link para escolher uma password nova. O link vale
        durante 1 hora. Veja também a pasta de spam.
      </p>
    );
  }

  return (
    <form action={acao}>
      <div className="campo">
        <label htmlFor="email">Email da sua conta</label>
        <input id="email" name="email" type="email" required maxLength={LIMITES.email} autoComplete="username" autoFocus />
      </div>

      {estado.erro && (
        <p className="erro" aria-live="polite">
          {estado.erro}
        </p>
      )}

      <button className="botao" disabled={aEnviar}>
        {aEnviar ? "A enviar..." : "Enviar link"}
      </button>
    </form>
  );
}
