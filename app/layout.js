import { cookies, headers } from "next/headers";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { COOKIE_CONSENTIMENTO, CONVERSAO_SNIPPET, lerConsentimento, etiquetas } from "../lib/consentimento";

const manrope = Manrope({ subsets: ["latin"], variable: "--fonte" });
// Só nos números, contadores e etiquetas técnicas — ver design.md.
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--fonte-mono" });

// A landing page (app/inicio) tem o título e a descrição para o Google.
export const metadata = { title: "First Media CRM" };

// Etiqueta da Google (gtag.js), em todas as páginas, logo a abrir o <head>, com o
// Google Analytics e o Google Ads — cada um só para quem aceitou a sua categoria
// no aviso de cookies da landing page. Um só gtag.js serve as duas.
// Os dois scripts levam o nonce do pedido: sem ele, a CSP (proxy.js) não os deixava correr.
const inicioGtag = (ids) => `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
${ids.map((id) => `
  gtag('config', '${id}');`).join("")}
`;

// O tema vem do cookie que o botão grava: a página já sai do servidor no tema
// escolhido. Sem cookie, fica o escuro do design.md.
export default async function Layout({ children }) {
  const jar = await cookies();
  const tema = jar.get("tema")?.value === "claro" ? "claro" : undefined;
  const consentimento = lerConsentimento(jar.get(COOKIE_CONSENTIMENTO)?.value);
  const ids = consentimento ? etiquetas(consentimento) : [];
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="pt-PT" className={`${manrope.variable} ${mono.variable}`} data-tema={tema}>
      <head>
        {ids.length > 0 && (
          <>
            {/* Google tag (gtag.js) */}
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${ids[0]}`} nonce={nonce} />
            <script nonce={nonce} dangerouslySetInnerHTML={{ __html: inicioGtag(ids) }} />
          </>
        )}
        {consentimento?.publicidade && (
          // Event snippet for CRM 2 conversion page
          <script nonce={nonce} dangerouslySetInnerHTML={{ __html: CONVERSAO_SNIPPET }} />
        )}
        {/* OffConversion: em todas as páginas e para todas as visitas, por decisão
            (sem depender do aviso de cookies). Lê os formulários (data-forms). */}
        <script
          async
          src="https://api.offconversion.com/v1/p"
          data-id="pk_live_kg-HC7HywyHjCxa6NKWbKxdwuP__QS-Q"
          data-consent-mode="auto"
          data-forms="true"
          nonce={nonce}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
