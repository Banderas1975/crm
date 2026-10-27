"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  COOKIE_CONSENTIMENTO,
  VALIDADE_CONSENTIMENTO,
  OFFCONVERSION,
  escreverConsentimento,
  estadoGoogle,
} from "../lib/consentimento";

// Aviso de cookies da landing page: uma faixa em baixo na primeira visita, e um
// painel de preferências que se reabre em "Gerir cookies", no rodapé. "Aceitar"
// e "Recusar" têm o mesmo peso, como pede a CNPD. Duas categorias opcionais:
// Estatísticas (Google Analytics) e Publicidade (Google Ads). A etiqueta Google
// carrega sempre com tudo negado (Consent Mode v2, app/layout.js); a escolha
// daqui passa à Google com gtag('consent', 'update').

const ABRIR = "abrir-preferencias-cookies";

const TUDO = { estatisticas: true, publicidade: true };
const NADA = { estatisticas: false, publicidade: false };

function gravar(escolha) {
  const seguro = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${COOKIE_CONSENTIMENTO}=${escreverConsentimento(escolha)}; path=/; max-age=${VALIDADE_CONSENTIMENTO}; samesite=lax${seguro}`;
}

// Aceitou a publicidade agora: o OffConversion também começa já. Este aviso só
// existe na landing page, uma das páginas públicas onde o OffConversion entra.
function carregarOffConversion() {
  if (document.querySelector(`script[src="${OFFCONVERSION.src}"]`)) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = OFFCONVERSION.src;
  s.dataset.id = OFFCONVERSION.id;
  s.dataset.consentMode = "auto";
  s.dataset.forms = "true";
  document.head.appendChild(s);
}

// Retirou uma autorização: apaga os cookies da Google neste site — _ga… do
// Google Analytics e _gcl… do Google Ads —, com e sem www.
function apagarCookiesGoogle() {
  const host = location.hostname;
  const dominios = ["", host, `.${host}`, `.${host.replace(/^www\./, "")}`];
  for (const par of document.cookie.split(";")) {
    const nome = par.split("=")[0].trim();
    if (!nome.startsWith("_ga") && !nome.startsWith("_gcl")) continue;
    for (const d of dominios) {
      document.cookie = `${nome}=; path=/; max-age=0${d ? `; domain=${d}` : ""}`;
    }
  }
}

export default function AvisoCookies({ escolha: inicial }) {
  const [escolha, setEscolha] = useState(inicial); // { estatisticas, publicidade } ou null
  const [prefs, setPrefs] = useState(inicial ?? NADA);
  const painel = useRef(null);

  useEffect(() => {
    const abrir = () => {
      setPrefs(escolha ?? NADA);
      painel.current?.showModal();
    };
    window.addEventListener(ABRIR, abrir);
    return () => window.removeEventListener(ABRIR, abrir);
  }, [escolha]);

  const decidir = (nova) => {
    gravar(nova);
    painel.current?.close();
    const antes = escolha ?? NADA;
    if ((antes.estatisticas && !nova.estatisticas) || (antes.publicidade && !nova.publicidade)) {
      // Retirou uma autorização: a Google deixa de guardar, os cookies dela saem,
      // e a página recarrega para o OffConversion (se estava a correr) parar.
      window.gtag?.("consent", "update", estadoGoogle(nova));
      apagarCookiesGoogle();
      location.reload();
      return;
    }
    window.gtag?.("consent", "update", estadoGoogle(nova));
    if (nova.publicidade && !antes.publicidade) carregarOffConversion();
    setEscolha(nova);
  };

  return (
    <>
      {!escolha && (
        <div className="lp-cookies" role="region" aria-label="Aviso de cookies">
          <div className="lp-cookies-texto">
            <p className="lp-cookies-titulo">Usamos cookies</p>
            <p>
              Os essenciais mantêm o site a funcionar. Com a sua autorização, usamos também cookies de estatística
              (Google Analytics), para perceber como o site é usado, e de publicidade (Google Ads), para medir os
              nossos anúncios e mostrá-los a quem já nos visitou. Pode mudar de ideias quando quiser, em
              &laquo;Gerir cookies&raquo;, no fim da página. Saiba mais na{" "}
              <Link href="/privacidade">política de privacidade</Link>.
            </p>
          </div>
          <div className="lp-cookies-acoes">
            <button type="button" className="lp-cookies-texto-botao" onClick={() => painel.current?.showModal()}>
              Personalizar
            </button>
            <button type="button" className="lp-cookies-botao lp-cookies-secundario" onClick={() => decidir(NADA)}>
              Recusar
            </button>
            <button type="button" className="lp-cookies-botao" onClick={() => decidir(TUDO)}>
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
              Google Analytics, da Google: quantas pessoas visitam o site e que páginas abrem.
            </p>
          </div>
          <label className="lp-interruptor">
            <input
              type="checkbox"
              role="switch"
              checked={prefs.estatisticas}
              onChange={(e) => setPrefs({ ...prefs, estatisticas: e.target.checked })}
              aria-label="Cookies de estatística"
            />
            <span aria-hidden="true" />
          </label>
        </div>

        <div className="lp-cookies-categoria">
          <div>
            <p className="lp-cookies-categoria-nome">Publicidade</p>
            <p>
              Google Ads, da Google: mede se os nossos anúncios trazem visitas e pedidos, e permite mostrar os
              anúncios a quem já visitou o site.
            </p>
          </div>
          <label className="lp-interruptor">
            <input
              type="checkbox"
              role="switch"
              checked={prefs.publicidade}
              onChange={(e) => setPrefs({ ...prefs, publicidade: e.target.checked })}
              aria-label="Cookies de publicidade"
            />
            <span aria-hidden="true" />
          </label>
        </div>

        <div className="lp-cookies-painel-acoes">
          <button type="button" className="lp-cookies-botao lp-cookies-secundario" onClick={() => decidir(NADA)}>
            Recusar todos
          </button>
          <button
            type="button"
            className="lp-cookies-botao lp-cookies-secundario"
            onClick={() => decidir(prefs)}
          >
            Guardar preferências
          </button>
          <button type="button" className="lp-cookies-botao" onClick={() => decidir(TUDO)}>
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
