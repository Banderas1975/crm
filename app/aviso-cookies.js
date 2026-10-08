"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GA_ID, COOKIE_CONSENTIMENTO, VALIDADE_CONSENTIMENTO } from "../lib/consentimento";

// Aviso de cookies da landing page: uma faixa em baixo na primeira visita, e um
// painel de preferências que se reabre em "Gerir cookies", no rodapé. "Aceitar"
// e "Recusar" têm o mesmo peso, como pede a CNPD. Sem escolha, o Google
// Analytics não carrega (app/layout.js lê o mesmo cookie no servidor).

const ABRIR = "abrir-preferencias-cookies";

function gravar(valor) {
  const seguro = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${COOKIE_CONSENTIMENTO}=${valor}; path=/; max-age=${VALIDADE_CONSENTIMENTO}; samesite=lax${seguro}`;
}

// Aceitou agora: o Google Analytics começa já, sem recarregar a página.
// O script criado aqui é aceite pela CSP porque vem de um script com nonce.
function carregarAnalytics() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
}

// Retirou o consentimento: apaga os cookies do Google Analytics (_ga, _ga_…),
// que ficam no domínio principal, com e sem www.
function apagarCookiesAnalytics() {
  const host = location.hostname;
  const dominios = ["", host, `.${host}`, `.${host.replace(/^www\./, "")}`];
  for (const par of document.cookie.split(";")) {
    const nome = par.split("=")[0].trim();
    if (!nome.startsWith("_ga")) continue;
    for (const d of dominios) {
      document.cookie = `${nome}=; path=/; max-age=0${d ? `; domain=${d}` : ""}`;
    }
  }
}

export default function AvisoCookies({ escolha: inicial }) {
  const [escolha, setEscolha] = useState(inicial); // "estatisticas", "essenciais" ou null
  const [estatisticas, setEstatisticas] = useState(inicial === "estatisticas");
  const painel = useRef(null);

  useEffect(() => {
    const abrir = () => {
      setEstatisticas(escolha === "estatisticas");
      painel.current?.showModal();
    };
    window.addEventListener(ABRIR, abrir);
    return () => window.removeEventListener(ABRIR, abrir);
  }, [escolha]);

  const decidir = (valor) => {
    gravar(valor);
    painel.current?.close();
    if (valor === "estatisticas" && escolha !== "estatisticas") carregarAnalytics();
    if (valor === "essenciais" && escolha === "estatisticas") {
      // O Google Analytics já está a correr nesta página: só recarregando pára.
      apagarCookiesAnalytics();
      location.reload();
      return;
    }
    setEscolha(valor);
  };

  return (
    <>
      {!escolha && (
        <div className="lp-cookies" role="region" aria-label="Aviso de cookies">
          <div className="lp-cookies-texto">
            <p className="lp-cookies-titulo">Usamos cookies</p>
            <p>
              Os essenciais mantêm o site a funcionar. Com a sua autorização, usamos também cookies de estatística
              (Google Analytics) para perceber como o site é usado. Pode mudar de ideias quando quiser, em
              &laquo;Gerir cookies&raquo;, no fim da página. Saiba mais na{" "}
              <Link href="/privacidade">política de privacidade</Link>.
            </p>
          </div>
          <div className="lp-cookies-acoes">
            <button type="button" className="lp-cookies-texto-botao" onClick={() => painel.current?.showModal()}>
              Personalizar
            </button>
            <button type="button" className="lp-cookies-botao lp-cookies-secundario" onClick={() => decidir("essenciais")}>
              Recusar
            </button>
            <button type="button" className="lp-cookies-botao" onClick={() => decidir("estatisticas")}>
              Aceitar
            </button>
          </div>
        </div>
      )}

      <dialog className="lp-cookies-painel" ref={painel} aria-labelledby="cookies-painel-titulo">
        <div className="lp-cookies-painel-topo">
          <h2 id="cookies-painel-titulo">Preferências de cookies</h2>
          <button type="button" className="lp-cookies-fechar" onClick={() => painel.current?.close()} aria-label="Fechar">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <p className="lp-cookies-painel-intro">
          Escolha que cookies aceita. Pode voltar aqui quando quiser, em &laquo;Gerir cookies&raquo;, no fim da página.
        </p>

        <div className="lp-cookies-categoria">
          <div>
            <p className="lp-cookies-categoria-nome">Essenciais</p>
            <p>Mantêm a sua sessão aberta no CRM, lembram o tema claro ou escuro e esta escolha. Sem eles o site não funciona.</p>
          </div>
          <label className="lp-interruptor">
            <input type="checkbox" role="switch" checked disabled aria-label="Cookies essenciais: sempre ativos" />
            <span aria-hidden="true" />
          </label>
        </div>

        <div className="lp-cookies-categoria">
          <div>
            <p className="lp-cookies-categoria-nome">Estatísticas</p>
            <p>
              Google Analytics, da Google: quantas pessoas visitam o site e que páginas abrem. Não servem para
              publicidade.
            </p>
          </div>
          <label className="lp-interruptor">
            <input
              type="checkbox"
              role="switch"
              checked={estatisticas}
              onChange={(e) => setEstatisticas(e.target.checked)}
              aria-label="Cookies de estatística"
            />
            <span aria-hidden="true" />
          </label>
        </div>

        <div className="lp-cookies-painel-acoes">
          <button type="button" className="lp-cookies-botao lp-cookies-secundario" onClick={() => decidir("essenciais")}>
            Recusar todos
          </button>
          <button
            type="button"
            className="lp-cookies-botao lp-cookies-secundario"
            onClick={() => decidir(estatisticas ? "estatisticas" : "essenciais")}
          >
            Guardar preferências
          </button>
          <button type="button" className="lp-cookies-botao" onClick={() => decidir("estatisticas")}>
            Aceitar todos
          </button>
        </div>
      </dialog>
    </>
  );
}

// Ligação "Gerir cookies" do rodapé: reabre o painel de preferências.
export function GerirCookies() {
  return (
    <button type="button" className="lp-rodape-botao" onClick={() => window.dispatchEvent(new Event(ABRIR))}>
      Gerir cookies
    </button>
  );
}
