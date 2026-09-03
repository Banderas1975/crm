// Guarda e confere a senha do administrador.
// scrypt vem do próprio Node: não precisamos de biblioteca nenhuma.
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derivar = promisify(scrypt);
const TAMANHO = 64;

export async function criarHash(senha) {
  const sal = randomBytes(16).toString("hex");
  const chave = await derivar(senha, sal, TAMANHO);
  return `${sal}:${chave.toString("hex")}`;
}

export async function senhaConfere(senha, guardado) {
  const [sal, hashHex] = (guardado || "").split(":");
  if (!sal || !hashHex) return false;

  const esperado = Buffer.from(hashHex, "hex");
  if (esperado.length !== TAMANHO) return false;

  const calculado = await derivar(senha, sal, TAMANHO);
  return timingSafeEqual(esperado, calculado);
}
