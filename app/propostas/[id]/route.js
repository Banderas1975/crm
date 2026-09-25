import { supabase } from "../../../lib/supabase";
import { exigirSessao } from "../../sessao-actions";
import { TIPOS_PROPOSTA, idValido } from "../../../lib/validacao";

// A única porta para abrir uma proposta. O bucket é privado e não há links
// públicos nem links assinados: cada download passa por aqui, com sessão
// aprovada verificada no banco no momento do pedido.
export async function GET(pedido, { params }) {
  await exigirSessao();

  const { id: idCru } = await params;
  const id = Number(idCru);
  if (!idValido(id)) return new Response("Proposta não encontrada.", { status: 404 });

  const { data: proposta } = await supabase
    .from("propostas")
    .select("nome, caminho")
    .eq("id", id)
    .single();
  if (!proposta) return new Response("Proposta não encontrada.", { status: 404 });

  const { data: ficheiro, error } = await supabase.storage
    .from("propostas")
    .download(proposta.caminho);

  if (error || !ficheiro) {
    console.error("Falha a ler proposta:", error?.message);
    return new Response("Não foi possível abrir a proposta.", { status: 500 });
  }

  const tipo = proposta.caminho.split(".").pop();
  // Versão só com letras simples para navegadores antigos; a completa vai em filename*.
  const simples = proposta.nome.replace(/[^\w.\- ]/g, "_");
  // encodeURIComponent deixa passar ' ( ) *, que o filename* não aceita.
  const completo = encodeURIComponent(proposta.nome).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );

  return new Response(ficheiro, {
    headers: {
      "Content-Type": TIPOS_PROPOSTA[tipo],
      // Descarrega sempre, nunca abre dentro do CRM.
      "Content-Disposition": `attachment; filename="${simples}"; filename*=UTF-8''${completo}`,
      // Não fica guardado em cache no navegador nem em nenhum servidor pelo meio.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
