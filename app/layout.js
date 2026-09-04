import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--fonte" });
// Só nos números, contadores e etiquetas técnicas — ver design.md.
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--fonte-mono" });

export const metadata = { title: "Meu CRM" };

export default function Layout({ children }) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
