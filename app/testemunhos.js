"use client";

import { useEffect, useRef, useState } from "react";

const INTERVALO_MS = 7000;

const iniciais = (nome) =>
  nome
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// Slideshow dos testemunhos da landing page. Todos os testemunhos vão no HTML
// (as IAs e quem não tem JavaScript leem-nos todos); só se vê um de cada vez.
// Passa sozinho a cada 7 segundos, mas pára quando o rato ou o teclado estão
// lá, quando a pessoa navega à mão, ou se o sistema pede menos animação.
export default function Testemunhos({ lista }) {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [parado, setParado] = useState(false); // a pessoa navegou: não volta a andar sozinho
  const toque = useRef(null);
  const total = lista.length;

  const ir = (i) => setAtual((i + total) % total);
  const navegar = (i) => {
    setParado(true);
    ir(i);
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setParado(true);
  }, []);

  useEffect(() => {
    if (pausado || parado) return;
    const t = setTimeout(() => setAtual((a) => (a + 1) % total), INTERVALO_MS);
    return () => clearTimeout(t);
  }, [atual, pausado, parado, total]);

  const teclas = (e) => {
    if (e.key === "ArrowLeft") navegar(atual - 1);
    if (e.key === "ArrowRight") navegar(atual + 1);
  };

  return (
    <div
      className="lp-testemunhos"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Testemunhos de clientes"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      onKeyDown={teclas}
      onTouchStart={(e) => (toque.current = e.touches[0].clientX)}
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
