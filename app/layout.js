import { cookies } from "next/headers";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--fonte" });
// Só nos números, contadores e etiquetas técnicas — ver design.md.
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--fonte-mono" });

// A landing page (app/inicio) tem o título e a descrição para o Google.
export const metadata = { title: "First Media CRM" };

// O tema vem do cookie que o botão grava: a página já sai do servidor no tema
// escolhido. Sem cookie, fica o escuro do design.md.
export default async function Layout({ children }) {
  const tema = (await cookies()).get("tema")?.value === "claro" ? "claro" : undefined;
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${mono.variable}`} data-tema={tema}>
      <body>{children}</body>
    </html>
  );
}
