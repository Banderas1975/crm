// As repetições que uma tarefa pode ter. Repetir é opcional: sem isto, a
// tarefa acontece uma vez e acabou.
export const REPETICOES = {
  diaria: "todos os dias",
  semanal: "todas as semanas",
  mensal: "todos os meses",
};

function somarDias(iso, quantos) {
  const dia = new Date(`${iso}T00:00:00Z`);
  dia.setUTCDate(dia.getUTCDate() + quantos);
  return dia.toISOString().slice(0, 10);
}

// Somar um mês a 31 de janeiro não pode dar 3 de março: o dia encolhe para o
// último que o mês de destino tem.
function somarMes(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const destino = new Date(Date.UTC(ano, mes, 1));
  const ultimo = new Date(Date.UTC(destino.getUTCFullYear(), destino.getUTCMonth() + 1, 0));
  destino.setUTCDate(Math.min(dia, ultimo.getUTCDate()));
  return destino.toISOString().slice(0, 10);
}

// A seguinte conta a partir de hoje quando a tarefa já estava atrasada:
// concluir uma tarefa diária esquecida há dez dias dá a de amanhã, e não mais
// uma atrasada. Sem isto, quem se atrasasse ficava preso a uma fila do passado.
export function proximaData(venceEm, repete, hoje) {
  const base = venceEm > hoje ? venceEm : hoje;

  if (repete === "diaria") return somarDias(base, 1);
  if (repete === "semanal") return somarDias(base, 7);
  if (repete === "mensal") return somarMes(base);
  return null;
}
