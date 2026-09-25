"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarReuniao } from "./actions";
import { DURACOES, LIMITES } from "../lib/validacao";

// contatos e usuarios: quem pode ser escolhido como participante.
export default function NovaReuniao({ contatoId, nome, contatos, usuarios }) {
  const [estado, acao, salvando] = useActionState(criarReuniao, { erro: "" });
  const formulario = useRef(null);

  // A action devolve um contador que sobe a cada reunião guardada.
  const ultimo = useRef(0);
  useEffect(() => {
    if (estado.salvo && estado.salvo !== ultimo.current) {
      ultimo.current = estado.salvo;
      formulario.current?.reset();
    }
  }, [estado.salvo]);

  return (
    <form action={acao} ref={formulario} className="nova-tarefa nova-reuniao">
      <input type="hidden" name="contato_id" value={contatoId} />

      <div className="campo">
        <label htmlFor="reuniao-titulo">Assunto</label>
        <input
          id="reuniao-titulo"
          name="titulo"
          type="text"
          required
          maxLength={LIMITES.reuniao}
          autoComplete="off"
          placeholder="Apresentar a proposta"
        />
      </div>

      <div className="tarefa-campos">
        <div className="campo">
          <label htmlFor="reuniao-dia">Dia</label>
          <input id="reuniao-dia" name="dia" type="date" required />
        </div>
        <div className="campo">
          <label htmlFor="reuniao-hora">Hora (Lisboa)</label>
          <input id="reuniao-hora" name="hora" type="time" required step={300} />
        </div>
        <div className="campo">
          <label htmlFor="reuniao-duracao">Duração</label>
          <select id="reuniao-duracao" name="duracao" defaultValue={60}>
            {DURACOES.map((minutos) => (
              <option key={minutos} value={minutos}>
                {minutos < 60 ? `${minutos} min` : `${minutos / 60} h`.replace(".5", ",5")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="campo">
        <label htmlFor="reuniao-local">Local (opcional)</label>
        <input
          id="reuniao-local"
          name="local"
          type="text"
          maxLength={LIMITES.local}
          autoComplete="off"
          placeholder="Escritório do cliente, ou link da videochamada"
        />
      </div>

      <div className="tarefa-campos">
        <div className="campo">
          <label htmlFor="reuniao-contatos">Outros contatos</label>
          <select id="reuniao-contatos" name="contatos" multiple>
            {contatos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="reuniao-usuarios">Da equipa</label>
          <select id="reuniao-usuarios" name="usuarios" multiple>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="ajuda">
        {nome} participa sempre. Para escolher vários, carregue em Ctrl (ou Cmd) ao clicar.
      </p>

      {estado.erro && (
        <p className="erro" aria-live="polite">
          {estado.erro}
        </p>
      )}

      <button className="botao botao-pequeno" disabled={salvando}>
        {salvando ? "A guardar..." : "Marcar reunião"}
      </button>
    </form>
  );
}
