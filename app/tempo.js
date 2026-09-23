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
