import { supabase } from "../../lib/supabase";
import { gerarXlsx } from "../../lib/xlsx";
import { exigirSessao } from "../acesso";
import { emLisboa, formatarHora, hojeEmLisboa } from "../tempo";
import { TAMANHO_LOTE } from "../../lib/validacao";

// Descarrega um lote de até 500 contatos em .xlsx, por ordem alfabética (a
// mesma da lista em Contatos). Só os contatos de quem pede. O ficheiro é
// gerado na hora e não fica guardado em lado nenhum.
export async function GET(pedido) {
  const eu = await exigirSessao();

  const lote = Number(new URL(pedido.url).searchParams.get("lote"));
  if (!Number.isInteger(lote) || lote < 1) {
    return new Response("Lote inválido.", { status: 400 });
  }

  const inicio = (lote - 1) * TAMANHO_LOTE;
  const { data: contatos, error } = await supabase
    .from("contatos")
    .select("nome, email, telefone, etapa, criado_em")
    .eq("dono_id", eu.id)
    .order("nome")
    .order("id")
    .range(inicio, inicio + TAMANHO_LOTE - 1);

  if (error) {
    console.error("Falha a exportar contatos:", error.message);
    return new Response("Não foi possível exportar agora. Tente de novo.", { status: 500 });
  }
  if (!contatos.length) return new Response("Esse lote não tem contatos.", { status: 404 });

  // A data de criação em hora de Lisboa, como no resto do CRM.
  const quando = (instante) => {
    const { dia, minutos } = emLisboa(instante);
    return `${dia} ${formatarHora(minutos)}`;
  };

  const ficheiro = gerarXlsx({
    nomeFolha: `Lote ${lote}`,
    cabecalho: ["Nome", "Email", "Telefone", "Etapa", "Criado em"],
    linhas: contatos.map((c) => [c.nome, c.email, c.telefone, c.etapa, quando(c.criado_em)]),
    larguras: [34, 34, 20, 14, 18],
  });

  return new Response(ficheiro, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="contatos-lote-${lote}-${hojeEmLisboa()}.xlsx"`,
      // Dados pessoais: nem o navegador nem servidores pelo meio guardam cópia.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
