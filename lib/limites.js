// Contadores contra abusos: tentativas de login e pedidos da landing page.
// Cada contador tem uma chave (por exemplo "login-ip:<ip>"), conta dentro de
// uma janela de tempo e, ao chegar ao máximo, fica bloqueado durante um tempo.
import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";
import { supabase } from "./supabase";

// O IP de quem faz o pedido, já baralhado (hash): na base de dados nunca fica
// o IP verdadeiro. Vem do cabeçalho X-Real-IP, que o nginx da VPS tem de pôr
// (proxy_set_header X-Real-IP $remote_addr;). Sem ele, devolve null e os
// limites por IP ficam desligados — nunca se bloqueia toda a gente por engano.
export async function ipDoPedido() {
  const ip = ((await headers()).get("x-real-ip") ?? "").trim();
  if (!isIP(ip)) return null;
  return createHash("sha256").update(`${process.env.SESSAO_SEGREDO}:${ip}`).digest("hex").slice(0, 32);
}

export async function bloqueado(chave) {
  const { data } = await supabase.from("limites").select("bloqueado_ate").eq("chave", chave).maybeSingle();
  return Boolean(data?.bloqueado_ate && Date.parse(data.bloqueado_ate) > Date.now());
}

// Conta mais uma vez. Ao chegar a `max` dentro de `janelaMs`, a chave fica
// bloqueada durante `bloqueioMs` e a contagem recomeça. Devolve true se bloqueou.
export async function contar(chave, max, janelaMs, bloqueioMs) {
  const agora = Date.now();
  const { data } = await supabase.from("limites").select("contagem, inicio").eq("chave", chave).maybeSingle();
  const dentro = data && agora - Date.parse(data.inicio) < janelaMs;
  const contagem = dentro ? data.contagem + 1 : 1;
  const bloqueia = contagem >= max;

  await supabase.from("limites").upsert({
    chave,
    contagem: bloqueia ? 0 : contagem,
    inicio: dentro && !bloqueia ? data.inicio : new Date(agora).toISOString(),
    bloqueado_ate: bloqueia ? new Date(agora + bloqueioMs).toISOString() : null,
  });
  return bloqueia;
}

export async function limpar(chave) {
  await supabase.from("limites").delete().eq("chave", chave);
}

// Apaga todas as chaves que começam por `prefixo` (as de um email, por exemplo).
export async function limparComecadas(prefixo) {
  const seguro = prefixo.replace(/[\\%_]/g, (c) => `\\${c}`);
  await supabase.from("limites").delete().like("chave", `${seguro}%`);
}
