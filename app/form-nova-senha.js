"use client";

import { useActionState } from "react";
import CampoSenha from "./campo-senha";
import { definirSenha } from "./recuperar-actions";
import { LIMITES } from "../lib/validacao";

export default function FormNovaSenha({ token }) {
  const [estado, acao, aGuardar] = useActionState(definirSenha, { erro: "" });

  return (
    <form action={acao}>
      <input type="hidden" name="token" value={token} />

      <div className="campo">
        <label htmlFor="senha">Password nova</label>
        <CampoSenha id="senha" name="senha" maxLength={LIMITES.senha} autoComplete="new-password" />
        <p className="ajuda">Pelo menos 8 caracteres.</p>
      </div>

      <div className="campo">
        <label htmlFor="confirmacao">Repita a password nova</label>
        <CampoSenha id="confirmacao" name="confirmacao" maxLength={LIMITES.senha} autoComplete="new-password" />
      </div>

      {estado.erro && (
        <p className="erro" aria-live="polite">
          {estado.erro}
        </p>
      )}

      <button className="botao" disabled={aGuardar}>
        {aGuardar ? "A guardar..." : "Guardar password nova"}
      </button>
    </form>
  );
}
