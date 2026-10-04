// /sitemap.xml — as páginas públicas, para o Google e as IAs as encontrarem.
const SITE = "https://firstmediacrm.online";

export default function sitemap() {
  return [
    { url: `${SITE}/`, lastModified: "2026-10-04", changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/privacidade`, lastModified: "2026-10-04", changeFrequency: "yearly", priority: 0.3 },
  ];
}
