"use client";

import { useActionState } from "react";
import { guardarPreferencias, enviarTeste } from "./emails-actions";
import { LIMITES } from "../lib/validacao";

export default function PreferenciasEmail({ conta }) {
  const [estado, acao, guardando] = useActionState(guardarPreferencias, { erro: "" });
  const [teste, acaoTeste, aEnviar] = useActionState(enviarTeste, { erro: "" });

  return (
    <>
      <form action={acao}>
        <div className="campo">
          <label htmlFor="email_avisos">Email para receber os avisos</label>
          <input
            id="email_avisos"
            name="email_avisos"
            type="email"
            maxLength={LIMITES.email}
            defaultValue={conta.email_avisos ?? ""}
            placeholder={conta.email}
            autoComplete="off"
          />
          <p className="ajuda">Vazio: usa o email da sua conta ({conta.email}).</p>
        </div>

        <fieldset className="escolhas">
          <legend>Que avisos quer receber</legend>
          <label>
            <input type="checkbox" name="aviso_tarefas" defaultChecked={conta.aviso_tarefas} />
            Resumo das tarefas atrasadas e de hoje, todos os dias às 8h
          </label>
          <label>
            <input type="checkbox" name="aviso_tarefa_antes" defaultChecked={conta.aviso_tarefa_antes} />
            Tarefa daqui a uma hora
          </label>
          <label>
            <input type="checkbox" name="aviso_reuniao_antes" defaultChecked={conta.aviso_reuniao_antes} />
            Reunião daqui a uma hora
          </label>
          <label>
            <input type="checkbox" name="aviso_reuniao_alterada" defaultChecked={conta.aviso_reuniao_alterada} />
            Reunião em que participo foi marcada ou mudou de hora
          </label>
        </fieldset>

        {estado.erro && (
          <p className="erro" aria-live="polite">
            {estado.erro}
          </p>
        )}
        {!guardando && estado.salvo > 0 && !estado.erro && (
          <p className="ajuda" aria-live="polite">
            Guardado.
          </p>
        )}

        <button className="botao botao-pequeno" disabled={guardando}>
          {guardando ? "A guardar..." : "Guardar preferências"}
        </button>
      </form>

      <form action={acaoTeste} className="teste-email">
        <button className="botao-contorno" disabled={aEnviar}>
          {aEnviar ? "A enviar..." : "Enviar email de teste"}
        </button>
        {teste.erro && (
          <p className="erro" aria-live="polite">
            {teste.erro}
          </p>
        )}
        {teste.aviso && (
          <p className="aviso" aria-live="polite">
            {teste.aviso}
          </p>
        )}
      </form>
    </>
  );
}
