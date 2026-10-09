"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { pedirExperiencia } from "./leads-actions";
import { LIMITES } from "../lib/validacao";

// A mesma chave é lida em app/preencher-registo.js.
const DADOS_REGISTO = "dados-registo";

export default function FormLead() {
  const [estado, acao, aEnviar] = useActionState(pedirExperiencia, { erro: "" });
  const router = useRouter();

  // Pedido enviado: segue logo para criar conta, com nome, email e telefone já
  // escritos. Os dados passam pela memória do separador (sessionStorage), não
  // pelo endereço: assim não ficam no histórico nem nas estatísticas de visitas.
  useEffect(() => {
    if (!estado.enviado) return;
    try {
      if (estado.dados) sessionStorage.setItem(DADOS_REGISTO, JSON.stringify(estado.dados));
    } catch {}
    router.push("/registo");
  }, [estado, router]);

  if (estado.enviado) {
    return (
      <div className="lp-obrigado" aria-live="polite">
        <h3>Pedido recebido. Obrigado!</h3>
        <p>A abrir a página para criar a sua conta…</p>
      </div>
    );
  }

  const v = estado.valores ?? {};

  return (
    <form action={acao} className="lp-form">
      <div className="lp-form-grelha">
        <div className="campo">
          <label htmlFor="lead-nome">
            Nome <span className="lp-obrigatorio">*</span>
          </label>
          <input id="lead-nome" name="nome" defaultValue={v.nome} required maxLength={LIMITES.nome} autoComplete="name" />
        </div>
        <div className="campo">
          <label htmlFor="lead-email">
            Email <span className="lp-obrigatorio">*</span>
          </label>
          <input id="lead-email" name="email" defaultValue={v.email} type="email" required maxLength={LIMITES.email} autoComplete="email" />
        </div>
        <div className="campo">
          <label htmlFor="lead-telefone">Telefone (opcional)</label>
          <input id="lead-telefone" name="telefone" defaultValue={v.telefone} type="tel" maxLength={40} autoComplete="tel" />
        </div>
        <div className="campo">
          <label htmlFor="lead-empresa">Empresa (opcional)</label>
          <input id="lead-empresa" name="empresa" defaultValue={v.empresa} maxLength={LIMITES.nome} autoComplete="organization" />
        </div>
      </div>

      <div className="campo">
        <label htmlFor="lead-mensagem">Mensagem (opcional)</label>
        <textarea id="lead-mensagem" name="mensagem" defaultValue={v.mensagem} rows={3} maxLength={1000} />
      </div>

      {/* Escondido de pessoas; só robôs o preenchem. */}
      <div className="lp-escondido" aria-hidden="true">
        <label htmlFor="lead-site">Site</label>
        <input id="lead-site" name="site" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="lp-consentimento">
        <input type="checkbox" name="consentimento" value="sim" defaultChecked={v.consentimento === "sim"} required />
        <span>
          Aceito que a First Media use estes dados para me contactar sobre o First Media CRM, como descrito na{" "}
          <Link href="/privacidade" target="_blank" rel="noopener">
            política de privacidade
          </Link>
          . <span className="lp-obrigatorio">*</span>
        </span>
      </label>

      <p className="lp-legenda">
        <span className="lp-obrigatorio">*</span> Obrigatório
      </p>

      {estado.erro && (
        <p className="erro" aria-live="polite">
          {estado.erro}
        </p>
      )}

      <button className="botao lp-botao-grande" disabled={aEnviar}>
        {aEnviar ? "A enviar..." : "Quero os 14 dias grátis já"}
      </button>
    </form>
  );
}
