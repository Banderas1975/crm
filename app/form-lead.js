"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { pedirExperiencia } from "./leads-actions";
import { LIMITES } from "../lib/validacao";
import CampoSenha from "./campo-senha";

export default function FormLead() {
  const [estado, acao, aEnviar] = useActionState(pedirExperiencia, { erro: "" });

  // Conta criada e sessão aberta: entra logo no CRM. Antes, a conversão do
  // Google Ads, só para contas criadas (estado.dados; um robô não os tem), com
  // o email para as conversões otimizadas: a Google recebe-o cifrado (hash) e
  // só o usa se a pessoa aceitou a publicidade (ad_user_data). A página muda
  // quando a Google confirma o envio, ou ao fim de 1,5 segundos no máximo.
  useEffect(() => {
    if (!estado.enviado) return;
    const entrar = () => window.location.assign("/");
    if (estado.dados && typeof window.gtag_report_conversion === "function") {
      window.gtag("set", "user_data", { email: estado.dados.email });
      window.gtag_report_conversion("/");
      const t = setTimeout(entrar, 1500);
      return () => clearTimeout(t);
    }
    entrar();
  }, [estado]);

  if (estado.enviado) {
    return (
      <div className="lp-obrigado" aria-live="polite">
        <h3>Conta criada. Bem-vindo!</h3>
        <p>Os seus 14 dias grátis começaram. A abrir o CRM…</p>
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
        <label htmlFor="lead-senha">
          Senha para entrar no CRM <span className="lp-obrigatorio">*</span>
        </label>
        <CampoSenha id="lead-senha" name="senha" minLength={8} maxLength={LIMITES.senha} autoComplete="new-password" />
        <p className="ajuda">Pelo menos 8 caracteres.</p>
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
        {aEnviar ? "A enviar..." : "Começar já"}
      </button>
    </form>
  );
}
