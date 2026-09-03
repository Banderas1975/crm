"use client";

import { useActionState, useState } from "react";
import { salvarContato } from "./actions";
import { INDICATIVOS } from "./indicativos";
import { LIMITES } from "../lib/validacao";

// País pré-selecionado no seletor de indicativo.
const PADRAO = "+351";

export default function Formulario() {
  const [estado, acao, salvando] = useActionState(salvarContato, { erro: "" });
  // Guarda o país escolhido para adaptar a validação do número.
  // Ao salvar, o React limpa o formulário: o onReset abaixo devolve
  // este estado ao mesmo país que o select volta a mostrar.
  const [indicativo, setIndicativo] = useState(PADRAO);

  const portugues = indicativo === "+351";

  return (
    <form action={acao} onReset={() => setIndicativo(PADRAO)}>
      <div className="campo">
        <label htmlFor="nome">Nome</label>
        <input id="nome" name="nome" type="text" required maxLength={LIMITES.nome} autoComplete="off" />
      </div>

      <div className="campo">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" maxLength={LIMITES.email} autoComplete="off" />
      </div>

      <div className="campo">
        <label htmlFor="telefone">Telefone</label>
        <div className="campo-duplo">
          <select
            name="indicativo"
            defaultValue={PADRAO}
            onChange={(e) => setIndicativo(e.target.value)}
            aria-label="Indicativo do país"
          >
            {INDICATIVOS.map(({ pais, codigo }) => (
              <option key={pais} value={codigo}>
                {pais} ({codigo})
              </option>
            ))}
          </select>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder={portugues ? "912345678" : "Número sem o indicativo"}
            pattern={portugues ? "[ ]*([0-9][ ]*){9}" : "[ ]*([0-9][ ]*){4,20}"}
            title={
              portugues
                ? "Os telefones portugueses têm exatamente 9 dígitos, sem o indicativo."
                : "Escreva só os dígitos do número, sem o indicativo do país."
            }
          />
        </div>
      </div>

      {estado.erro && (
        <p className="erro" aria-live="polite">
          {estado.erro}
        </p>
      )}

      <button className="botao" disabled={salvando}>
        {salvando ? "Salvando..." : "Salvar contato"}
      </button>
    </form>
  );
}
