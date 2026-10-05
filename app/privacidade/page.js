import Link from "next/link";
import "../inicio/landing.css";

// Pública, com o aspeto da landing page (é para lá que aponta o link do formulário).
export const dynamic = "force-dynamic";

export const metadata = { title: "Política de privacidade — First Media CRM" };

export default function Privacidade() {
  return (
    <div className="lp">
      <header className="lp-topo">
        <div className="lp-largura lp-topo-linha">
          <Link href="/" className="lp-logo">
            <img src="/logo-first-media.png" alt="First Media" width={132} height={47} />
            <span>CRM</span>
          </Link>
          <div className="lp-topo-acoes">
            <Link href="/" className="lp-entrar">
              Voltar ao início
            </Link>
          </div>
        </div>
      </header>

      <main className="lp-largura lp-estreito lp-texto">
        <h1>Política de privacidade</h1>
        <p>Última atualização: 4 de outubro de 2026.</p>

        <h2>Quem trata os seus dados</h2>
        <p>
          A First Media é responsável pelos dados pessoais recolhidos no site do First Media CRM. Para qualquer
          questão sobre os seus dados, escreva para <a href="mailto:crm@firstmedia.pt">crm@firstmedia.pt</a>.
        </p>

        <h2>Que dados recolhemos</h2>
        <ul>
          <li>
            <strong>No formulário de 14 dias grátis:</strong> nome, email, telefone, empresa, número de utilizadores, a
            mensagem (se escrever alguma) e a data em que deu o consentimento.
          </li>
          <li>
            <strong>Se usar o CRM:</strong> o nome, o telefone e o email da conta, a password (guardada apenas em forma cifrada, que nem nós
            conseguimos ler) e os dados que introduz no CRM, como contactos, tarefas e reuniões.
          </li>
          <li>
            <strong>Para proteger o site contra abusos:</strong> nas tentativas de entrar no CRM e nos pedidos do
            formulário, um código derivado do endereço IP (não o próprio IP), que não permite saber qual era o IP.
          </li>
        </ul>

        <h2>Para que usamos os dados</h2>
        <p>
          Os dados do formulário servem para o contactarmos sobre o First Media CRM e ativarmos a sua experiência
          gratuita. A base legal é o seu consentimento, que dá ao marcar a caixa no formulário. Os dados da conta servem
          para o CRM funcionar: entrar, guardar o seu trabalho e enviar os avisos por email que escolher.
        </p>
        <p>Não vendemos os seus dados nem os usamos para publicidade de terceiros.</p>

        <h2>Durante quanto tempo os guardamos</h2>
        <p>
          Os dados do formulário são guardados até 24 meses depois do último contacto, ou até retirar o seu
          consentimento, se for antes. Os dados da conta são guardados enquanto a conta estiver ativa. O código derivado
          do endereço IP é apagado automaticamente ao fim de 2 dias, no máximo.
        </p>

        <h2>Com quem partilhamos</h2>
        <p>
          Apenas com os fornecedores que tornam o serviço possível: o alojamento do servidor, a base de dados e o envio
          de emails. Estes fornecedores só tratam os dados por nossa conta e segundo as nossas instruções.
        </p>

        <h2>Cookies</h2>
        <p>
          Usamos apenas cookies essenciais: um para manter a sua sessão aberta no CRM e outro para lembrar se escolheu
          o tema claro ou escuro. Não usamos cookies de publicidade nem de estatísticas.
        </p>

        <h2>Os seus direitos</h2>
        <p>
          Pode, a qualquer momento, pedir acesso aos seus dados, corrigi-los, apagá-los, opor-se ao seu tratamento,
          pedir uma cópia para levar para outro serviço, ou retirar o seu consentimento. Basta escrever para{" "}
          <a href="mailto:crm@firstmedia.pt">crm@firstmedia.pt</a>. Retirar o consentimento não afeta o que foi feito
          antes.
        </p>
        <p>
          Se achar que os seus dados não foram bem tratados, pode apresentar queixa à Comissão Nacional de Proteção de
          Dados (CNPD), em <a href="https://www.cnpd.pt">www.cnpd.pt</a>.
        </p>
      </main>

      <footer className="lp-rodape">
        <div className="lp-largura lp-rodape-linha">
          <span>© First Media</span>
          <span className="lp-rodape-links">
            <Link href="/">Início</Link>
            <Link href="/login">Entrar no CRM</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
