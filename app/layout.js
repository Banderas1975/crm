import { cookies, headers } from "next/headers";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--fonte" });
// Só nos números, contadores e etiquetas técnicas — ver design.md.
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--fonte-mono" });

// A landing page (app/inicio) tem o título e a descrição para o Google.
export const metadata = { title: "First Media CRM" };

// Google Analytics (etiqueta gtag.js), em todas as páginas, logo a abrir o <head>.
// Os dois scripts levam o nonce do pedido: sem ele, a CSP (proxy.js) não os deixava correr.
const GA_ID = "G-XBHF60CQXZ";
const GA_INICIO = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${GA_ID}');
`;

// O tema vem do cookie que o botão grava: a página já sai do servidor no tema
// escolhido. Sem cookie, fica o escuro do design.md.
export default async function Layout({ children }) {
  const tema = (await cookies()).get("tema")?.value === "claro" ? "claro" : undefined;
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="pt-PT" className={`${manrope.variable} ${mono.variable}`} data-tema={tema}>
      <head>
        {/* Google tag (gtag.js) */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} nonce={nonce} />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: GA_INICIO }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
