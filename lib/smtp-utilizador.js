// Envio pela caixa de email de cada utilizador (configurada na área Backend).
// Os emails do sistema — avisos, leads, recuperação de password — continuam a
// sair de crm@ por lib/email.js. Isto é separado de propósito.
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import nodemailer from "nodemailer";

export const PORTAS = [
  { porta: 465, nome: "465 — SSL/TLS (recomendado)" },
  { porta: 587, nome: "587 — STARTTLS" },
  { porta: 25, nome: "25 — STARTTLS" },
  { porta: 2525, nome: "2525 — STARTTLS" },
];

// Endereços que não são da internet: a própria VPS, a rede interna, etc.
// Sem isto, alguém podia pôr "localhost" como servidor e usar o CRM para
// espreitar serviços que só a VPS vê.
const internos = new BlockList();
for (const [rede, bits] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 3],
]) internos.addSubnet(rede, bits, "ipv4");
for (const [rede, bits] of [["::", 127], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8], ["64:ff9b::", 96]]) {
  internos.addSubnet(rede, bits, "ipv6");
}

function interno(ip) {
  if (isIP(ip) === 4) return internos.check(ip, "ipv4");
  const mapeado = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip); // IPv4 escrito como IPv6
  return mapeado ? internos.check(mapeado[1], "ipv4") : internos.check(ip, "ipv6");
}

// Descobre o IP do servidor e recusa os internos. A ligação é feita a esse IP
// (o nome só serve para conferir o certificado): o nome não pode trocar de IP
// entre a verificação e a ligação.
async function resolver(servidor) {
  let enderecos;
  try {
    enderecos = await lookup(servidor, { all: true });
  } catch {
    throw new Error("Não encontrámos esse servidor. Confirme o nome (por exemplo, smtp.exemplo.pt).");
  }
  if (!enderecos.length || enderecos.some((e) => interno(e.address))) {
    throw new Error("Esse servidor não é permitido. Use o servidor SMTP do seu fornecedor de email.");
  }
  return enderecos[0].address;
}

// Traduz os erros do servidor de email para algo que se perceba.
function explicar(erro) {
  const codigo = erro?.code ?? "";
  const resposta = erro?.responseCode ?? 0;
  if (codigo === "EAUTH" || resposta === 535) return "O servidor recusou o utilizador ou a password.";
  if (codigo === "ETIMEDOUT" || codigo === "ECONNECTION" || codigo === "ECONNREFUSED") {
    return "Não foi possível ligar ao servidor nesta porta. Confirme o servidor e a porta.";
  }
  if (codigo === "ESOCKET" || codigo === "ETLS") {
    return "Falhou a ligação segura. Confirme a porta: 465 para SSL/TLS, 587 para STARTTLS.";
  }
  if (codigo === "EENVELOPE" || resposta === 550 || resposta === 553) {
    return "O servidor não aceitou o email do remetente. Normalmente tem de ser o mesmo do utilizador.";
  }
  return String(erro?.message ?? erro).slice(0, 200);
}

// config: { servidor, porta, utilizador, senha, remetente_nome, remetente_email }
export async function enviarPelaCaixa(config, { para, assunto, texto, html }) {
  const ip = await resolver(config.servidor);
  const transporte = nodemailer.createTransport({
    host: ip,
    port: config.porta,
    secure: config.porta === 465,
    requireTLS: config.porta !== 465,
    auth: { user: config.utilizador, pass: config.senha },
    tls: { servername: config.servidor },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
  try {
    await transporte.sendMail({
      from: { name: config.remetente_nome || "", address: config.remetente_email },
      to: para,
      subject: assunto.replace(/[\r\n]+/g, " "),
      text: texto,
      html,
    });
  } catch (erro) {
    throw new Error(explicar(erro));
  } finally {
    transporte.close();
  }
}
