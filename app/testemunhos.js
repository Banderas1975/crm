"use client";

import { useEffect, useRef, useState } from "react";

const INTERVALO_MS = 5000;

const iniciais = (nome) =>
  nome
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// Slideshow dos testemunhos da landing page. Todos os testemunhos vão no HTML
// (as IAs e quem não tem JavaScript leem-nos todos); só se vê um de cada vez.
// Passa sozinho a cada 5 segundos. Enquanto a pessoa mexe — rato em movimento
// por cima, toque, teclas, cliques nas setas — fica parado; 5 segundos depois
// de ela parar (ou logo que o rato saia), volta ao automático. Se o sistema
// pede menos animação, nunca passa sozinho.
export default function Testemunhos({ lista }) {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [semAnimacao, setSemAnimacao] = useState(false);
  const toque = useRef(null);
  const espera = useRef(null);
  const total = lista.length;

  // A pessoa está a usar o slideshow: pára, e retoma quando ela parar de mexer.
  const atividade = () => {
    setPausado(true);
    clearTimeout(espera.current);
    espera.current = setTimeout(() => setPausado(false), INTERVALO_MS);
  };
  const retomar = () => {
    clearTimeout(espera.current);
    setPausado(false);
  };

  const navegar = (i) => {
    atividade();
    setAtual((i + total) % total);
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setSemAnimacao(true);
    return () => clearTimeout(espera.current);
  }, []);

  useEffect(() => {
    if (pausado || semAnimacao) return;
    const t = setTimeout(() => setAtual((a) => (a + 1) % total), INTERVALO_MS);
    return () => clearTimeout(t);
  }, [atual, pausado, semAnimacao, total]);

  const teclas = (e) => {
    if (e.key === "ArrowLeft") navegar(atual - 1);
    else if (e.key === "ArrowRight") navegar(atual + 1);
    else atividade();
  };

  return (
    <div
      className="lp-testemunhos"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Testemunhos de clientes"
      onMouseMove={atividade}
      onMouseLeave={retomar}
      onKeyDown={teclas}
      onTouchStart={(e) => {
        atividade();
        toque.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (toque.current ?? 0);
        if (Math.abs(dx) > 40) navegar(dx < 0 ? atual + 1 : atual - 1);
        toque.current = null;
      }}
    >
      <div className="lp-testemunhos-janela">
        <div className="lp-testemunhos-faixa" style={{ transform: `translateX(-${atual * 100}%)` }}>
          {lista.map((t, i) => (
            <figure
              key={t.nome}
              className="lp-testemunho"
              role="group"
              aria-roledescription="testemunho"
              aria-label={`${i + 1} de ${total}`}
              aria-hidden={i !== atual}
            >
              <svg className="lp-testemunho-aspas" viewBox="0 0 48 36" width="48" height="36" aria-hidden="true">
                <path d="M0 36V22C0 9.6 6.4 2.3 19.2 0l2 5.4C14.3 7.2 10.8 11 10.4 17H20v19H0zm28 0V22C28 9.6 34.4 2.3 47.2 0l2 5.4C42.3 7.2 38.8 11 38.4 17H48v19H28z" />
              </svg>
              <blockquote>
                <p>{t.texto}</p>
              </blockquote>
              <figcaption>
                <span className="lp-testemunho-iniciais" aria-hidden="true">
                  {iniciais(t.nome)}
                </span>
                <span className="lp-testemunho-nome">{t.nome}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="lp-testemunhos-controlos">
        <button type="button" className="lp-testemunhos-seta" onClick={() => navegar(atual - 1)} aria-label="Testemunho anterior">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>

        <div className="lp-testemunhos-pontos">
          {lista.map((t, i) => (
            <button
              key={t.nome}
              type="button"
              className={i === atual ? "ativo" : ""}
              onClick={() => navegar(i)}
              aria-label={`Testemunho de ${t.nome}`}
              aria-current={i === atual}
            />
          ))}
        </div>

        <button type="button" className="lp-testemunhos-seta" onClick={() => navegar(atual + 1)} aria-label="Testemunho seguinte">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
