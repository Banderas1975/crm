// Impede o Next de escrever o próprio bloco de instruções dentro do CLAUDE.md.
// O limite das Server Actions sobe de 1 MB para caber uma proposta de 4,5 MB
// mais o envelope do formulário. O teto real é conferido na action.
export default {
  agentRules: false,
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
};
