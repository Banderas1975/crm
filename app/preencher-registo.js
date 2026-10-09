"use client";

import { useEffect } from "react";
import { INDICATIVOS } from "./indicativos";

// Quem acabou de pedir os 14 dias grátis na landing page chega aqui com nome,
// email e telefone guardados na memória do separador (ver app/form-lead.js).
// Preenche o formulário de criar conta e apaga-os logo: só servem uma vez.

// "+351 912 345 678", "00351912345678" ou "912345678" → indicativo e número.
// Sem indicativo escrito, fica Portugal.
function separarTelefone(texto) {
  const limpo = (texto || "").replace(/[^\d+]/g, "");
  if (/^(\+|00)/.test(limpo)) {
    const digitos = limpo.replace(/^(\+|00)/, "");
    const codigos = INDICATIVOS.map((i) => i.codigo.slice(1)).sort((a, b) => b.length - a.length);
    const codigo = codigos.find((c) => digitos.startsWith(c));
    if (codigo) return { indicativo: `+${codigo}`, numero: digitos.slice(codigo.length) };
  }
  return { indicativo: "+351", numero: limpo.replace(/\D/g, "") };
}

export default function PreencherRegisto() {
  useEffect(() => {
    let dados;
    try {
      dados = JSON.parse(sessionStorage.getItem("dados-registo") || "null");
      sessionStorage.removeItem("dados-registo");
    } catch {
      return;
    }
    if (!dados) return;

    const escrever = (id, valor) => {
      const campo = document.getElementById(id);
      if (campo && valor && !campo.value) campo.value = valor;
    };
    escrever("nome", dados.nome);
    escrever("email", dados.email);
    if (dados.telefone) {
      const { indicativo, numero } = separarTelefone(dados.telefone);
      const seletor = document.querySelector('select[name="indicativo"]');
      if (seletor) seletor.value = indicativo;
      escrever("telefone", numero);
    }
    // Falta só a senha: o cursor vai para lá.
    document.getElementById("senha")?.focus();
  }, []);

  return null;
}
