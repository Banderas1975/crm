// Cabeçalhos de segurança em todas as respostas. A CSP, que muda a cada
// pedido, é posta no proxy.js.
const SEGURANCA = [
  // Nenhum outro site pode mostrar o CRM dentro de uma moldura (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // O navegador não adivinha tipos de ficheiro: usa o que o servidor diz.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Para fora só vai o domínio, nunca o endereço completo (que tem ids).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // O CRM não usa câmara, microfone nem localização: ficam desligados.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Só HTTPS durante dois anos, depois da primeira visita.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// agentRules: impede o Next de escrever o próprio bloco de instruções no CLAUDE.md.
// bodySizeLimit: cabe uma proposta de 4,5 MB mais o envelope do formulário.
export default {
  agentRules: false,
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  async headers() {
    return [{ source: "/:path*", headers: SEGURANCA }];
  },
};
