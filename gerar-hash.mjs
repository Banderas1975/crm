// Gera o hash da senha do administrador para colar no .env.local.
// A senha é escrita aqui no terminal e NUNCA é guardada em lado nenhum.
import { createInterface } from "node:readline/promises";
import { criarHash } from "./lib/senha.js";

const terminal = createInterface({ input: process.stdin, output: process.stdout });
const senha = await terminal.question("Escreva a senha do administrador: ");
terminal.close();

if (!senha.trim()) {
  console.log("\nSenha vazia. Nada foi gerado.");
  process.exit(1);
}

console.log("\nCopie a linha abaixo INTEIRA e cole no .env.local depois de ADMIN_SENHA_HASH=\n");
console.log(await criarHash(senha));
console.log("");
