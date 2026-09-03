// Cria (ou atualiza) a sua conta de administrador na tabela usuarios,
// reaproveitando o email e o hash que já estão no .env.local.
// Correr com: node --env-file=.env.local criar-admin.mjs
import { supabase } from "./lib/supabase.js";

const email = (process.env.ADMIN_USUARIO || "").trim().toLowerCase();
const hash = process.env.ADMIN_SENHA_HASH || "";

if (!email || !hash) {
  console.log("FALHA: falta ADMIN_USUARIO ou ADMIN_SENHA_HASH no .env.local");
  process.exit(1);
}

const { error } = await supabase
  .from("usuarios")
  .upsert({ email, senha_hash: hash, papel: "admin", estado: "aprovado" }, { onConflict: "email" });

if (error) {
  console.log("FALHA:", error.message);
  process.exit(1);
}

console.log(`OK: ${email} está na tabela usuarios como administrador, já aprovado.`);
console.log("A senha é a mesma que já usava.");
