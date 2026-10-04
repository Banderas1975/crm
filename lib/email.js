// Envio de emails pelo SMTP da caixa do CRM (crm@firstmedia.pt).
// Tudo vem do .env.local da VPS — nada disto fica no código:
//   SMTP_HOST, SMTP_PORT (465 = ligação cifrada desde o início), SMTP_USER, SMTP_PASS
//   EMAIL_REMETENTE (opcional) — o nome e endereço que aparecem no "De:"
import nodemailer from "nodemailer";

let transporte;

export const envioConfigurado = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

function obterTransporte() {
  if (!transporte) {
    const porta = Number(process.env.SMTP_PORT || 465);
    transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: porta,
      // 465 cifra desde o primeiro byte; 587 começa simples e passa a cifrado (STARTTLS).
      secure: porta === 465,
      requireTLS: porta !== 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // Sem isto, um servidor que não responde deixava o envio à espera até 10 minutos.
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    });
  }
  return transporte;
}

// Hoje sai sempre de crm@. "remetente" existe para, mais tarde, cada utilizador
// poder enviar da sua própria caixa sem mudar quem chama esta função.
export async function enviarEmail({ para, assunto, texto, html, remetente }) {
  if (!envioConfigurado()) throw new Error("Envio de email por configurar (SMTP no .env.local).");

  await obterTransporte().sendMail({
    from: remetente || process.env.EMAIL_REMETENTE || `First Media CRM <${process.env.SMTP_USER}>`,
    to: para,
    // Um assunto nunca leva quebras de linha: seriam cabeçalhos novos no email.
    subject: assunto.replace(/[\r\n]+/g, " "),
    text: texto,
    html,
  });
}
