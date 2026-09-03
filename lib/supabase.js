import { createClient } from "@supabase/supabase-js";

// Cliente do banco. Usa a chave secreta, então só pode ser importado
// em código de servidor (Server Components, Route Handlers, Server Actions).
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
