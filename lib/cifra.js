// Cifra das passwords SMTP dos utilizadores (AES-256-GCM). A chave vem do
// .env da VPS — SMTP_CHAVE, 64 caracteres hexadecimais (openssl rand -hex 32) —
// e nunca está no código nem na base de dados.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function chave() {
  const hex = process.env.SMTP_CHAVE ?? "";
  return /^[0-9a-f]{64}$/i.test(hex) ? Buffer.from(hex, "hex") : null;
}

export const cifraConfigurada = () => chave() !== null;

// "v1:<iv>:<etiqueta>:<texto cifrado>", tudo em base64. A etiqueta garante que
// ninguém alterou o texto cifrado: se alguém mexer, decifrar falha.
export function cifrar(texto) {
  const k = chave();
  if (!k) throw new Error("SMTP_CHAVE em falta ou inválida no .env.");
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", k, iv);
  const dados = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), dados.toString("base64")].join(":");
}

export function decifrar(guardado) {
  const k = chave();
  if (!k) throw new Error("SMTP_CHAVE em falta ou inválida no .env.");
  const [versao, iv, etiqueta, dados] = String(guardado).split(":");
  if (versao !== "v1") throw new Error("Formato de password desconhecido.");
  const d = createDecipheriv("aes-256-gcm", k, Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(etiqueta, "base64"));
  return Buffer.concat([d.update(Buffer.from(dados, "base64")), d.final()]).toString("utf8");
}
