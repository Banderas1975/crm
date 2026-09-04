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
  timeZone: "Europe/Lisbon",
});
