// Todo o sistema conta os dias em Lisboa. Sem isto, quem abrisse a app noutro
// fuso via as tarefas no dia errado — "hoje" mudaria de sítio para sítio.
const FUSO = "Europe/Lisbon";

const RELATIVO = new Intl.RelativeTimeFormat("pt-PT", { numeric: "auto" });

const UNIDADES = [
  ["year", 31536000],
  ["month", 2592000],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

// "há 3 dias", "há 2 meses". Calculado no servidor, como as outras datas,
// para o texto ser o mesmo aqui e no site publicado.
export function haQuantoTempo(criadoEm) {
  const segundos = (new Date(criadoEm).getTime() - Date.now()) / 1000;

  for (const [unidade, tamanho] of UNIDADES) {
    if (Math.abs(segundos) >= tamanho) {
      return RELATIVO.format(Math.round(segundos / tamanho), unidade);
    }
  }
  return "agora mesmo";
}

// Data completa, para as anotações e os follow-ups guardados.
export const FORMATO_DATA = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: FUSO,
});

// "en-CA" devolve a data já no formato AAAA-MM-DD, que é o mesmo que o banco
// guarda na coluna de vencimento — assim comparam-se como texto, sem contas.
const DIA_ISO = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const hojeEmLisboa = () => DIA_ISO.format(new Date());

// Contas feitas em UTC sobre o dia já escolhido em Lisboa: o dia é só um
// rótulo AAAA-MM-DD, e somar-lhe dias nunca o faz saltar de fuso.
export function somarDias(iso, quantos) {
  const dia = new Date(`${iso}T00:00:00Z`);
  dia.setUTCDate(dia.getUTCDate() + quantos);
  return dia.toISOString().slice(0, 10);
}

// Domingo desta semana. Se hoje já for domingo, devolve hoje: nessa altura
// não sobra semana nenhuma à frente, e a secção "Esta semana" fica vazia.
export function fimDaSemana(hoje) {
  const dia = new Date(`${hoje}T00:00:00Z`);
  return somarDias(hoje, (7 - dia.getUTCDay()) % 7);
}

const DIA_CURTO = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "short",
  timeZone: FUSO,
});

// Lisboa nunca está atrás de UTC (é UTC+0 ou UTC+1), por isso a meia-noite
// UTC cai sempre no mesmo dia cá — não há risco de mostrar o dia anterior.
export const formatarDia = (iso) => DIA_CURTO.format(new Date(`${iso}T00:00:00Z`));

// ---- horas em Lisboa (calendário e reuniões) ----

// Segunda-feira da semana de um dia AAAA-MM-DD. As semanas começam à segunda.
export function inicioDaSemana(iso) {
  const dia = new Date(`${iso}T00:00:00Z`);
  return somarDias(iso, -((dia.getUTCDay() + 6) % 7));
}

const PARTES = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function partes(ms) {
  const p = Object.fromEntries(PARTES.formatToParts(ms).map(({ type, value }) => [type, value]));
  return { dia: `${p.year}-${p.month}-${p.day}`, h: Number(p.hour), m: Number(p.minute) };
}

// Um instante (do banco, em UTC) visto num relógio de Lisboa:
// { dia: "2026-09-25", minutos: 870 } — 870 minutos depois da meia-noite = 14:30.
export function emLisboa(instante) {
  const { dia, h, m } = partes(new Date(instante).getTime());
  return { dia, minutos: h * 60 + m };
}

// Quanto Lisboa está à frente de UTC naquele instante: 0 no inverno, 1h no verão.
function desvio(ms) {
  const { dia, h, m } = partes(ms);
  const [ano, mes, d] = dia.split("-").map(Number);
  return Date.UTC(ano, mes - 1, d, h, m) - Math.floor(ms / 60000) * 60000;
}

// O contrário: um dia e uma hora escritos em Lisboa, como instante UTC para gravar.
// Calcula o desvio duas vezes para acertar nos dias em que a hora muda.
export function deLisboa(dia, minutos) {
  const [ano, mes, d] = dia.split("-").map(Number);
  const ingenuo = Date.UTC(ano, mes - 1, d, 0, minutos);
  const aproximado = ingenuo - desvio(ingenuo);
  return new Date(ingenuo - desvio(aproximado)).toISOString();
}

// 870 → "14:30"
export const formatarHora = (minutos) =>
  `${String(Math.floor(minutos / 60) % 24).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
