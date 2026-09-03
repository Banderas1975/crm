// Sessão guardada num cookie assinado: "id.expira.assinatura".
// Usa Web Crypto (e não node:crypto) para funcionar tanto no servidor
// como no proxy, que corre num ambiente mais limitado.

const CODIFICADOR = new TextEncoder();

export const NOME_COOKIE = "sessao";
export const DURACAO_SEGUNDOS = 12 * 60 * 60; // 12 horas

async function chave() {
  const segredo = process.env.SESSAO_SEGREDO;
  if (!segredo) throw new Error("Falta SESSAO_SEGREDO no .env.local");
  return crypto.subtle.importKey(
    "raw",
    CODIFICADOR.encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

const paraHex = (buffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

const deHex = (texto) =>
  Uint8Array.from(texto.match(/../g) ?? [], (par) => parseInt(par, 16));

// Sem o segredo ninguém consegue forjar a assinatura, nem trocar o id por outro.
export async function criarSessao(idUtilizador) {
  const dados = `${idUtilizador}.${Date.now() + DURACAO_SEGUNDOS * 1000}`;
  const assinatura = await crypto.subtle.sign("HMAC", await chave(), CODIFICADOR.encode(dados));
  return `${dados}.${paraHex(assinatura)}`;
}

// Devolve o id do utilizador, ou null se o cookie não presta.
export async function lerSessao(valor) {
  if (!valor) return null;

  const [id, expira, assinatura] = valor.split(".");
  if (!id || !expira || !assinatura) return null;
  if (!Number(expira) || Number(expira) < Date.now()) return null;

  // verify compara em tempo constante, sem dar pistas pelo tempo de resposta.
  const valida = await crypto.subtle.verify(
    "HMAC",
    await chave(),
    deHex(assinatura),
    CODIFICADOR.encode(`${id}.${expira}`)
  );

  return valida ? Number(id) : null;
}

// Verificação rápida para o proxy, que não vai ao banco.
export async function sessaoValida(valor) {
  return (await lerSessao(valor)) !== null;
}
