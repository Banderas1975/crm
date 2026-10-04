"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "../lib/supabase";
import { exigirSessao } from "./acesso";
import { cifrar, decifrar, cifraConfigurada } from "../lib/cifra";
import { enviarPelaCaixa, PORTAS } from "../lib/smtp-utilizador";
import { LIMITES, emailValido } from "../lib/validacao";

const ESPERA_TESTE_MS = 20 * 1000; // entre dois testes seguidos
const NOME_SERVIDOR = /^(?=.{1,200}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

const campo = (dados, nome) => String(dados.get(nome) ?? "").trim();

// Guarda a configuração SMTP de quem está na sessão — só a sua, sempre.
export async function guardarSmtp(estadoAnterior, dados) {
  const eu = await exigirSessao();
  if (!cifraConfigurada()) return falha("O servidor ainda não tem a SMTP_CHAVE no .env. Fale com o administrador.");

  const servidor = campo(dados, "servidor").toLowerCase();
  const porta = Number(dados.get("porta"));
  const utilizador = campo(dados, "utilizador");
  const senha = String(dados.get("senha") ?? ""); // a password não se apara: um espaço pode fazer parte dela
  const remetenteNome = campo(dados, "remetente_nome").replace(/[\r\n"<>]+/g, " ");
  const remetenteEmail = campo(dados, "remetente_email").toLowerCase();

  // Se algo falhar, o formulário volta com o que se escreveu (menos a password):
  // o React limpa o formulário depois de cada envio.
  const valores = {
    servidor,
    porta,
    utilizador,
    remetente_nome: remetenteNome,
    remetente_email: remetenteEmail,
  };
  const falha = (erro) => ({ erro, valores, n: Date.now() });

  if (!NOME_SERVIDOR.test(servidor)) return falha("Escreva o nome do servidor SMTP, por exemplo smtp.exemplo.pt.");
  if (!PORTAS.some((p) => p.porta === porta)) return falha("Escolha uma das portas da lista.");
  if (!utilizador || utilizador.length > 200) return falha("Escreva o utilizador (normalmente, o seu email).");
  if (senha.length > LIMITES.senha) return falha("A password é muito comprida.");
  if (remetenteNome.length > 120) return falha("O nome do remetente é muito comprido.");
  if (!emailValido(remetenteEmail) || remetenteEmail.length > LIMITES.email) {
    return falha("O email do remetente não parece válido.");
  }

  const { data: atual } = await supabase.from("smtp_utilizadores").select("usuario_id").eq("usuario_id", eu.id).maybeSingle();

  // A password só muda se for escrita uma nova; vazia mantém a guardada.
  if (!senha && !atual) return falha("Escreva a password da caixa de email.");

  const linha = {
    usuario_id: eu.id,
    servidor,
    porta,
    utilizador,
    remetente_nome: remetenteNome || null,
    remetente_email: remetenteEmail,
    atualizado_em: new Date().toISOString(),
    // Mudou a configuração: o último teste já não diz nada sobre ela.
    testado_em: null,
    teste_ok: null,
    teste_erro: null,
    ...(senha ? { senha_cifrada: cifrar(senha) } : {}),
  };
  // Sem password nova, só se atualiza (a guardada fica); a primeira vez, insere-se.
  const { error } = atual
    ? await supabase.from("smtp_utilizadores").update(linha).eq("usuario_id", eu.id)
    : await supabase.from("smtp_utilizadores").insert(linha);
  if (error) {
    console.error("Falha a guardar SMTP:", error.message);
    return falha("Não foi possível guardar. Tente de novo.");
  }

  revalidatePath("/backend");
  const agora = Date.now();
  return { erro: "", salvo: agora, n: agora };
}

// Envia um email de teste pela caixa configurada, para o email da conta.
export async function testarSmtp(estadoAnterior) {
  const eu = await exigirSessao();
  if (!cifraConfigurada()) return { erro: "O servidor ainda não tem a SMTP_CHAVE no .env. Fale com o administrador." };

  const { data: config } = await supabase.from("smtp_utilizadores").select("*").eq("usuario_id", eu.id).maybeSingle();
  if (!config) return { erro: "Guarde primeiro a configuração." };

  if (config.testado_em && Date.now() - Date.parse(config.testado_em) < ESPERA_TESTE_MS) {
    return { erro: "Acabou de testar. Espere uns segundos antes de tentar de novo." };
  }
  // Marca já a hora: dois cliques seguidos não mandam dois emails.
  await supabase.from("smtp_utilizadores").update({ testado_em: new Date().toISOString() }).eq("usuario_id", eu.id);

  let senha;
  try {
    senha = decifrar(config.senha_cifrada);
  } catch {
    return { erro: "A password guardada já não se consegue ler (a chave do servidor mudou). Escreva-a de novo e guarde." };
  }

  let resultado;
  try {
    await enviarPelaCaixa(
      { ...config, senha },
      {
        para: eu.email,
        assunto: "Email de teste da sua caixa — First Media CRM",
        texto: "Se está a ler isto, a sua caixa de email ficou bem configurada no First Media CRM.",
        html: '<p style="font-family:Arial,sans-serif;font-size:15px;color:#151B24">Se está a ler isto, a sua caixa de email ficou bem configurada no First Media CRM.</p>',
      },
    );
    resultado = { teste_ok: true, teste_erro: null };
  } catch (erro) {
    resultado = { teste_ok: false, teste_erro: String(erro.message).slice(0, 300) };
  }

  await supabase.from("smtp_utilizadores").update(resultado).eq("usuario_id", eu.id);
  revalidatePath("/backend");
  return resultado.teste_ok
    ? { erro: "", aviso: `Email de teste enviado para ${eu.email}. Veja a sua caixa de entrada.` }
    : { erro: resultado.teste_erro };
}

// Apaga a configuração (e a password cifrada) de quem está na sessão.
export async function apagarSmtp() {
  const eu = await exigirSessao();
  await supabase.from("smtp_utilizadores").delete().eq("usuario_id", eu.id);
  revalidatePath("/backend");
}
