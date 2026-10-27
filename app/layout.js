import { cookies, headers } from "next/headers";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { COOKIE_CONSENTIMENTO, CONVERSAO_SNIPPET, GA_ID, ADS_IDS, lerConsentimento, estadoGoogle } from "../lib/consentimento";

const manrope = Manrope({ subsets: ["latin"], variable: "--fonte" });
// Só nos números, contadores e etiquetas técnicas — ver design.md.
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--fonte-mono" });

// A landing page (app/inicio) tem o título e a descrição para o Google.
export const metadata = { title: "First Media CRM" };

// Etiqueta da Google (gtag.js), em todas as páginas, logo a abrir o <head>, com o
// Google Analytics e o Google Ads. Carrega sempre, com o Consent Mode v2: por
// defeito tudo negado (sem cookies, sem dados pessoais, só sinais anónimos que a
// Google usa para modelar), e "update" com a escolha feita no aviso de cookies.
// Os scripts levam o nonce do pedido: sem ele, a CSP (proxy.js) não os deixava correr.
const IDS = [GA_ID, ...ADS_IDS];
const inicioGtag = (escolha) => `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', ${JSON.stringify({ ...estadoGoogle(null), wait_for_update: 500 })});
  gtag('set', 'ads_data_redaction', true);${
    escolha ? `
  gtag('consent', 'update', ${JSON.stringify(estadoGoogle(escolha))});` : ""
  }
  gtag('js', new Date());
${IDS.map((id) => `
  gtag('config', '${id}');`).join("")}
`;

// O tema vem do cookie que o botão grava: a página já sai do servidor no tema
// escolhido. Sem cookie, fica o escuro do design.md.
export default async function Layout({ children }) {
  const jar = await cookies();
  const tema = jar.get("tema")?.value === "claro" ? "claro" : undefined;
  const consentimento = lerConsentimento(jar.get(COOKIE_CONSENTIMENTO)?.value);
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="pt-PT" className={`${manrope.variable} ${mono.variable}`} data-tema={tema}>
      <head>
        {/* Google tag (gtag.js) */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${IDS[0]}`} nonce={nonce} />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: inicioGtag(consentimento) }} />
        {/* Event snippet for CRM 2 conversion page */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: CONVERSAO_SNIPPET }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
