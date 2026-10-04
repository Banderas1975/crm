// /robots.txt — o que os bots (Google e IAs) podem ler. A landing page e a
// política de privacidade são públicas; o resto é o CRM por dentro, com login.
const SITE = "https://firstmediacrm.online";

const PRIVADO = [
  "/login", "/registo", "/recuperar", "/inicio",
  "/funil", "/tarefas", "/calendario", "/contatos", "/emails", "/backend", "/usuarios",
  "/exportar", "/relatorios", "/propostas",
];

// Bots das IAs, nomeados para ficar claro que são bem-vindos na parte pública.
const BOTS_IA = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended",
];

export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVADO },
      { userAgent: BOTS_IA, allow: ["/", "/llms.txt"], disallow: PRIVADO },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
