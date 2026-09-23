"use client";

import Link from "next/link";
import { Fragment, useState, useTransition } from "react";
import { concluirTarefa } from "./actions";

// Uma tarefa por fazer. O contato só aparece na área Tarefas: na página do
// contato já se sabe de quem se está a falar.
export default function TarefaItem({ tarefa, mostrarContato = false }) {
  const [erro, setErro] = useState("");
  const [aConcluir, setAConcluir] = useState(false);
  const [, comecar] = useTransition();

  function concluir() {
    setErro("");
    setAConcluir(true);
    comecar(async () => {
      const { ok } = await concluirTarefa(tarefa.id);
      if (!ok) {
        setAConcluir(false);
        setErro("Não foi possível concluir. Tente de novo.");
      }
    });
  }

  const detalhes = [];
  if (mostrarContato && tarefa.contatos?.nome) {
    detalhes.push(
      <Link href={`/contatos/${tarefa.contato_id}`}>{tarefa.contatos.nome}</Link>
    );
  }
  if (tarefa.dia) detalhes.push(tarefa.dia);
  if (tarefa.repete) detalhes.push("repete");

  return (
    <li className={aConcluir ? "tarefa a-concluir" : "tarefa"}>
      <button
        type="button"
        className="tarefa-marca"
        onClick={concluir}
        disabled={aConcluir}
        aria-label={`Concluir: ${tarefa.titulo}`}
      />

      <div className="tarefa-texto">
        <p className="tarefa-titulo">{tarefa.titulo}</p>

        {detalhes.length > 0 && (
          <p className="tarefa-detalhes mono">
            {detalhes.map((parte, i) => (
              <Fragment key={i}>
                {i > 0 && " · "}
                {parte}
              </Fragment>
            ))}
          </p>
        )}

        {erro && (
          <p className="erro" aria-live="polite">
            {erro}
          </p>
        )}
      </div>
    </li>
  );
}
