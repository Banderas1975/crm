"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { moverTarefa, moverReuniao } from "./actions";
import { somarDias, formatarHora } from "./tempo";

// Altura de meia hora na grelha, em píxeis. A grelha tem o dia inteiro.
const MEIA_HORA = 22;
const HORAS = Array.from({ length: 24 }, (_, h) => h);

// Os dias chegam como AAAA-MM-DD; formatados em UTC mostram esse mesmo dia.
const SEMANA = new Intl.DateTimeFormat("pt-PT", { weekday: "short", timeZone: "UTC" });
const nomeDia = (iso) => SEMANA.format(new Date(`${iso}T00:00:00Z`)).replace(".", "");
const numeroDia = (iso) => Number(iso.slice(8));

const chave = (tipo, id) => `${tipo}:${id}`;

// Reuniões que se sobrepõem ficam lado a lado, cada uma na sua faixa.
function porFaixas(reunioes) {
  const fins = [];
  const colocadas = reunioes
    .toSorted((a, b) => a.minutos - b.minutos)
    .map((reuniao) => {
      let faixa = fins.findIndex((fim) => fim <= reuniao.minutos);
      if (faixa === -1) faixa = fins.length;
      fins[faixa] = reuniao.minutos + reuniao.duracao;
      return { ...reuniao, faixa };
    });
  return { colocadas, faixas: Math.max(1, fins.length) };
}

export default function Calendario({ vista, dias, mes, hoje, tarefas, reunioes }) {
  const [erro, setErro] = useState("");
  const [alvo, setAlvo] = useState(null);
  const [foco, setFoco] = useState(null);
  const [, comecar] = useTransition();
  const grelha = useRef(null);
  const raiz = useRef(null);

  // Mexe já no ecrã, sem esperar o servidor. Se a gravação falhar, o React
  // volta ao que o servidor diz — o cartão regressa sozinho ao sítio.
  const [lista, aplicarJa] = useOptimistic({ tarefas, reunioes }, (atual, mudanca) =>
    mudanca.tipo === "tarefa"
      ? {
          ...atual,
          tarefas: atual.tarefas.map((t) => (t.id === mudanca.id ? { ...t, dia: mudanca.dia } : t)),
        }
      : {
          ...atual,
          reunioes: atual.reunioes.map((r) =>
            r.id === mudanca.id ? { ...r, dia: mudanca.dia, minutos: mudanca.minutos } : r
          ),
        }
  );

  // Abre a grelha às 8h, em vez de à meia-noite.
  useEffect(() => {
    if (grelha.current) grelha.current.scrollTop = 16 * MEIA_HORA;
  }, [vista]);

  // Depois de mexer com as setas, o cartão muda de célula: o foco vai atrás dele.
  useEffect(() => {
    if (foco) raiz.current?.querySelector(`[data-item="${foco}"]`)?.focus();
  }, [foco, lista]);

  function mover(mudanca) {
    const { tipo, id, dia, minutos } = mudanca;
    if (tipo === "tarefa") {
      const tarefa = lista.tarefas.find((t) => t.id === id);
      if (!tarefa || tarefa.dia === dia) return;
    } else {
      const reuniao = lista.reunioes.find((r) => r.id === id);
      if (!reuniao || (reuniao.dia === dia && reuniao.minutos === minutos)) return;
    }

    setErro("");
    comecar(async () => {
      aplicarJa(mudanca);
      const { ok } =
        tipo === "tarefa" ? await moverTarefa(id, dia) : await moverReuniao(id, dia, minutos);
      if (!ok) setErro("Não foi possível mudar a data. O cartão voltou para onde estava.");
    });
  }

  // O que vem no arrastar: "tarefa:12" ou "reuniao:5:30", em que 30 é a
  // distância, em píxeis, entre o topo do cartão e o ponto onde se pegou nele.
  function largado(e, dia, naGrelha) {
    e.preventDefault();
    setAlvo(null);
    const [tipo, idCru, pegaCru] = e.dataTransfer.getData("text/plain").split(":");
    const id = Number(idCru);

    if (tipo === "tarefa") return mover({ tipo, id, dia });
    if (tipo !== "reuniao") return;

    const reuniao = lista.reunioes.find((r) => r.id === id);
    if (!reuniao) return;

    let minutos = reuniao.minutos;
    if (naGrelha) {
      const topo = e.clientY - e.currentTarget.getBoundingClientRect().top - Number(pegaCru || 0);
      minutos = Math.min(47, Math.max(0, Math.round(topo / MEIA_HORA))) * 30;
    }
    mover({ tipo, id, dia, minutos });
  }

  // O que torna uma célula num sítio onde se pode largar.
  const largavel = (dia, naGrelha = false) => ({
    onDragOver: (e) => {
      e.preventDefault();
      setAlvo(dia);
    },
    onDragLeave: () => setAlvo((atual) => (atual === dia ? null : atual)),
    onDrop: (e) => largado(e, dia, naGrelha),
  });

  // Arrastar não funciona com teclado nem no telemóvel. As setas fazem o mesmo:
  // ← → mudam o dia; ↑ ↓ mudam a hora de uma reunião, ou a semana de uma tarefa.
  function teclas(e, tipo, item) {
    const passos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1 };
    if (!(e.key in passos)) return;
    e.preventDefault();
    const passo = passos[e.key];
    const lado = e.key === "ArrowLeft" || e.key === "ArrowRight";
    setFoco(chave(tipo, item.id));

    if (tipo === "tarefa") {
      return mover({ tipo, id: item.id, dia: somarDias(item.dia, lado ? passo : passo * 7) });
    }
    if (lado) return mover({ tipo, id: item.id, dia: somarDias(item.dia, passo), minutos: item.minutos });
    const minutos = Math.min(1410, Math.max(0, item.minutos + passo * 30));
    mover({ tipo, id: item.id, dia: item.dia, minutos });
  }

  const arrastavel = (tipo, item, e) => {
    const pega = tipo === "reuniao" ? Math.round(e.clientY - e.currentTarget.getBoundingClientRect().top) : 0;
    e.dataTransfer.setData("text/plain", `${chave(tipo, item.id)}:${pega}`);
    e.dataTransfer.effectAllowed = "move";
  };

  // Funções simples e não componentes: um componente criado dentro do render
  // seria outro a cada render, e o cartão perdia o foco e o arrastar a meio.
  const tarefaItem = (tarefa) => (
    <Link
      key={chave("tarefa", tarefa.id)}
      href={`/contatos/${tarefa.contatoId}`}
      className="cal-item cal-tarefa"
      data-item={chave("tarefa", tarefa.id)}
      draggable
      onDragStart={(e) => arrastavel("tarefa", tarefa, e)}
      onKeyDown={(e) => teclas(e, "tarefa", tarefa)}
      title={`Tarefa: ${tarefa.titulo} · ${tarefa.nome}`}
    >
      <span className="cal-marca" aria-hidden="true" />
      <span className="cal-texto">{tarefa.titulo}</span>
    </Link>
  );

  const hora = (reuniao) =>
    `${formatarHora(reuniao.minutos)}–${formatarHora(reuniao.minutos + reuniao.duracao)}`;

  const reuniaoItem = (reuniao, estilo) => (
    <Link
      key={chave("reuniao", reuniao.id)}
      href={`/contatos/${reuniao.contatoId}`}
      className={estilo ? "cal-item cal-reuniao cal-bloco" : "cal-item cal-reuniao"}
      style={estilo}
      data-item={chave("reuniao", reuniao.id)}
      draggable
      onDragStart={(e) => arrastavel("reuniao", reuniao, e)}
      onKeyDown={(e) => teclas(e, "reuniao", reuniao)}
      title={`Reunião: ${reuniao.titulo} · ${hora(reuniao)} · ${reuniao.nome}${reuniao.local ? ` · ${reuniao.local}` : ""}`}
    >
      <span className="cal-hora mono">{estilo ? hora(reuniao) : formatarHora(reuniao.minutos)}</span>
      <span className="cal-texto">{reuniao.titulo}</span>
    </Link>
  );

  const doDia = (dia) => ({
    tarefas: lista.tarefas.filter((t) => t.dia === dia),
    reunioes: lista.reunioes.filter((r) => r.dia === dia).toSorted((a, b) => a.minutos - b.minutos),
  });

  const classeDia = (dia, base) =>
    [base, dia === hoje && "hoje", alvo === dia && "alvo", mes && !dia.startsWith(mes) && "fora"]
      .filter(Boolean)
      .join(" ");

  return (
    <div ref={raiz}>
      {erro && (
        <p className="erro" aria-live="polite">
          {erro}
        </p>
      )}

      {vista === "mes" ? (
        <div className="cal-rolar">
          <div className="cal-mes">
            {dias.slice(0, 7).map((dia) => (
              <p key={dia} className="cal-cabeca mono">
                {nomeDia(dia)}
              </p>
            ))}
            {dias.map((dia) => {
              const { tarefas: t, reunioes: r } = doDia(dia);
              return (
                <div key={dia} className={classeDia(dia, "cal-celula")} {...largavel(dia)}>
                  <p className="cal-numero mono">{numeroDia(dia)}</p>
                  {r.map((reuniao) => reuniaoItem(reuniao))}
                  {t.map(tarefaItem)}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="cal-rolar">
          <div className="cal-semana" style={{ "--colunas": dias.length }}>
            <div className="cal-canto" />
            {dias.map((dia) => (
              <p key={dia} className={classeDia(dia, "cal-cabeca mono")}>
                {nomeDia(dia)} <span className="cal-numero">{numeroDia(dia)}</span>
              </p>
            ))}

            <p className="cal-rotulo mono">tarefas</p>
            {dias.map((dia) => (
              <div key={dia} className={classeDia(dia, "cal-dia-todo")} {...largavel(dia)}>
                {doDia(dia).tarefas.map(tarefaItem)}
              </div>
            ))}
          </div>

          <div className="cal-grelha" ref={grelha}>
            <div className="cal-semana" style={{ "--colunas": dias.length }}>
              <div className="cal-horas">
                {HORAS.map((h) => (
                  <p key={h} className="cal-hora-rotulo mono" style={{ height: MEIA_HORA * 2 }}>
                    {formatarHora(h * 60)}
                  </p>
                ))}
              </div>

              {dias.map((dia) => {
                const { colocadas, faixas } = porFaixas(doDia(dia).reunioes);
                return (
                  <div
                    key={dia}
                    className={classeDia(dia, "cal-coluna")}
                    {...largavel(dia, true)}
                  >
                    {HORAS.map((h) => (
                      <div key={h} className="cal-slot" />
                    ))}
                    {colocadas.map((reuniao) =>
                      reuniaoItem(reuniao, {
                        top: (reuniao.minutos / 30) * MEIA_HORA,
                        height: Math.max(MEIA_HORA, (reuniao.duracao / 30) * MEIA_HORA) - 2,
                        left: `${(reuniao.faixa / faixas) * 100}%`,
                        width: `${100 / faixas}%`,
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <p className="ajuda">
        Arraste tarefas e reuniões para mudar o dia{vista !== "mes" && " ou a hora"}. Com o
        teclado: selecione com Tab e use ← → para mudar o dia, ↑ ↓ para a hora de uma reunião ou a
        semana de uma tarefa.
      </p>
    </div>
  );
}
