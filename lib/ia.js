import Anthropic from "@anthropic-ai/sdk";

const MODELO = "claude-sonnet-4-6";

const INSTRUCOES = `És o assistente comercial de um CRM e escreves mensagens de follow-up.

Regras da escrita:
- Português de Portugal.
- Tom profissional, caloroso e direto. Nada de linguagem de vendas agressiva.
- Curta: 2 a 4 frases.
- Se o nome for de uma pessoa, trata-a pelo primeiro nome. Se for uma empresa,
  dirige-te à empresa sem inventar o nome de quem lá trabalha.
- Usa as anotações para a mensagem encaixar na história real da relação.
- Não inventes factos, datas ou compromissos que não estejam nas anotações.
- Sem emojis.

Nunca escrevas espaços reservados entre parênteses retos, como [Nome] ou
[Empresa]. A mensagem tem de estar pronta a copiar e enviar tal como está.
Se não souberes alguma informação, escreve a frase sem ela.

Não te apresentes nem digas quem és: quem envia a mensagem já é conhecido do
contato.

O que devolves: só o texto da mensagem. Sem assunto, sem assinatura, sem aspas
e sem qualquer comentário teu antes ou depois.`;

const ETAPAS = {
  novo: "acabou de entrar, ainda não houve conversa",
  "em contato": "já houve conversa, a relação está a começar",
  proposta: "recebeu uma proposta e ainda não respondeu",
  cliente: "já é cliente",
};

export async function escreverFollowUp({ nome, etapa, anotacoes }) {
  const cliente = new Anthropic();

  const historico = anotacoes.length
    ? anotacoes.map((texto) => `- ${texto}`).join("\n")
    : "(ainda não há anotações sobre este contato)";

  const resposta = await cliente.messages.create({
    model: MODELO,
    max_tokens: 1000,
    system: INSTRUCOES,
    messages: [
      {
        role: "user",
        content: `Escreve o follow-up para este contato.

Nome: ${nome}
Etapa do funil: ${etapa} — ${ETAPAS[etapa] ?? etapa}

Anotações, da mais recente para a mais antiga:
${historico}`,
      },
    ],
  });

  return resposta.content
    .filter((bloco) => bloco.type === "text")
    .map((bloco) => bloco.text)
    .join("")
    .trim();
}
