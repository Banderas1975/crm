import { supabase } from "../../../lib/supabase";
import { exigirSessao } from "../../acesso";
import { cifraConfigurada } from "../../../lib/cifra";
import { PORTAS } from "../../../lib/smtp-utilizador";
import FormSmtp from "../../form-smtp";
import AcaoConfirmada from "../../acao-confirmada";
import { apagarSmtp } from "../../backend-actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Backend — First Media CRM" };

const QUANDO = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Lisbon",
});

export default async function Backend() {
  const eu = await exigirSessao();

  // Só a configuração de quem está na sessão. A password cifrada nunca sai do servidor.
  const { data: config } = await supabase
    .from("smtp_utilizadores")
    .select("servidor, porta, utilizador, remetente_nome, remetente_email, testado_em, teste_ok, teste_erro")
    .eq("usuario_id", eu.id)
    .maybeSingle();

  return (
    <>
      <header className="cabecalho">
        <h1>Backend</h1>
        <p className="apoio">Configurações da sua conta.</p>
      </header>

      <section className="cartao">
        <h2 className="titulo-secao">Email da sua caixa (SMTP)</h2>
        <p className="apoio smtp-explica">
          A caixa de onde vão sair os emails que enviar pelo CRM. Os dados estão nas definições do seu fornecedor de
          email. Os avisos automáticos do CRM continuam a sair de {process.env.SMTP_USER || "crm@firstmedia.pt"}.
        </p>

        {!cifraConfigurada() && (
          <p className="aviso">
            O servidor ainda não está preparado para guardar passwords de email (falta a SMTP_CHAVE). Fale com o
            administrador.
          </p>
        )}

        {config && (
          <p className={config.teste_ok === false ? "erro" : "aviso"}>
            {config.teste_ok === true && `Configurada · último teste correu bem (${QUANDO.format(new Date(config.testado_em))}).`}
            {config.teste_ok === false && `O último teste falhou: ${config.teste_erro}`}
            {config.teste_ok === null && "Configurada, ainda sem teste. Envie um email de teste para confirmar."}
          </p>
        )}

        <FormSmtp config={config} portas={PORTAS} emailConta={eu.email} />

        {config && (
          <div className="smtp-apagar">
            <AcaoConfirmada
              acao={apagarSmtp}
              id={eu.id}
              pergunta="Apagar a configuração da sua caixa de email, incluindo a password guardada?"
              texto="Apagar configuração"
            />
          </div>
        )}
      </section>
    </>
  );
}
