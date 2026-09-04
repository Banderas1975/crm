"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { mudarEtapa } from "./actions";
import { ETAPAS, CORES_ETAPA } from "./etapas";

export default function Kanban({ contatos }) {
  const router = useRouter();
  const [erro, setErro] = useState("");
  // Coluna por cima da qual o cartão está a passar, só para dar retorno visual.
  const [alvo, setAlvo] = useState(null);
  const [, comecar] = useTransition();

  // O cartão muda de coluna já, sem esperar o servidor. Se a gravação falhar,
  // o React devolve a lista ao que o servidor diz — o cartão volta sozinho.
  const [lista, aplicarJa] = useOptimistic(contatos, (atual, { id, etapa }) =>
    atual.map((contato) => (contato.id === id ? { ...contato, etapa } : contato))
  );

  function mover(id, etapa) {
    const contato = lista.find((c) => c.id === id);
    if (!contato || contato.etapa === etapa) return;

    setErro("");
    comecar(async () => {
      aplicarJa({ id, etapa });
      const { ok } = await mudarEtapa(id, etapa);
      if (!ok) setErro("Não foi possível mudar a etapa. O cartão voltou para onde estava.");
    });
  }

  // Uma passagem só pela lista, em vez de um filtro por coluna.
  const porEtapa = Object.fromEntries(ETAPAS.map((etapa) => [etapa, []]));
  for (const contato of lista) {
    if (contato.etapa in porEtapa) porEtapa[contato.etapa].push(contato);
  }

  return (
    <>
      {erro && (
        <p className="erro" aria-live="polite">
          {erro}
        </p>
      )}

      <div className="kanban">
        {ETAPAS.map((etapa) => (
          <section
            key={etapa}
            className={alvo === etapa ? "coluna alvo" : "coluna"}
            onDragOver={(e) => {
              e.preventDefault();
              setAlvo(etapa);
            }}
            onDragLeave={() => setAlvo((atual) => (atual === etapa ? null : atual))}
            onDrop={(e) => {
              e.preventDefault();
              setAlvo(null);
              mover(Number(e.dataTransfer.getData("text/plain")), etapa);
            }}
          >
            <div className="coluna-topo">
              <h2 className="coluna-nome" style={{ color: CORES_ETAPA[etapa] }}>
                {etapa}
              </h2>
              <span className="coluna-contador">{porEtapa[etapa].length}</span>
            </div>

            {porEtapa[etapa].length === 0 ? (
              <p className="coluna-vazia">Nenhum contato aqui.</p>
            ) : (
              porEtapa[etapa].map((contato) => (
                <article
                  key={contato.id}
                  className="cartao-contato"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", String(contato.id))}
                  // O nome já é um link; aqui é só para o resto do cartão
                  // também abrir o contato. O seletor de etapa fica de fora.
                  onClick={(e) => {
                    if (e.target.closest("a, select")) return;
                    router.push(`/contatos/${contato.id}`);
                  }}
                >
                  <p className="cartao-nome">
                    <Link href={`/contatos/${contato.id}`}>{contato.nome}</Link>
                  </p>
                  <p className="cartao-linha">{contato.email || "Sem email"}</p>
                  <p className="cartao-linha">{contato.tempo}</p>

                  {/* Arrastar não funciona com teclado nem no telemóvel.
                      Este seletor é o mesmo movimento, pelo caminho que sempre funciona. */}
                  <select
                    className="cartao-etapa"
                    draggable={false}
                    aria-label={`Etapa de ${contato.nome}`}
                    value={contato.etapa}
                    onChange={(e) => mover(contato.id, e.target.value)}
                  >
                    {ETAPAS.map((nome) => (
                      <option key={nome} value={nome}>
                        {nome}
                      </option>
                    ))}
                  </select>
                </article>
              ))
            )}
          </section>
        ))}
      </div>
    </>
  );
}
