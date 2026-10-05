import { timingSafeEqual } from "node:crypto";
import { enviarAvisos } from "../../avisos";
import { envioConfigurado } from "../../../lib/email";
import { limparAntigos } from "../../../lib/limites";

// Chamado pelo cron da VPS a cada 5 minutos. Não há sessão aqui: quem chama
// prova-se com o segredo CRON_SEGREDO do .env.local, no cabeçalho Authorization.
function autorizado(pedido) {
  const segredo = process.env.CRON_SEGREDO;
  if (!segredo || segredo.length < 32) return false;
  const recebido = Buffer.from(pedido.headers.get("authorization") ?? "");
  const esperado = Buffer.from(`Bearer ${segredo}`);
  // Comparação em tempo constante: a demora não dá pistas sobre o segredo.
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}

export async function POST(pedido) {
  if (!autorizado(pedido)) return new Response("Não autorizado.", { status: 401 });

  // Aproveita a passagem do cron para apagar os contadores antigos contra abusos.
  // Uma falha aqui não impede os avisos.
  await limparAntigos().catch((erro) => console.error("Falha a limpar limites:", erro.message));
  if (!envioConfigurado()) return Response.json({ erro: "SMTP por configurar no .env.local" }, { status: 503 });

  try {
    return Response.json(await enviarAvisos());
  } catch (erro) {
    console.error("Falha nos avisos por email:", erro.message);
    return Response.json({ erro: "Falha a preparar os avisos." }, { status: 500 });
  }
}
