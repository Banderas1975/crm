import Link from "next/link";
import FormLead from "../form-lead";
import "./landing.css";

// Página pública: é o que vê quem abre o endereço do CRM sem sessão (o proxy
// mostra-a em "/"). Cores do logótipo — ver design.md, "Landing page".
// Dinâmica para levar o nonce da CSP (ver proxy.js); estática, os scripts não corriam.
export const dynamic = "force-dynamic";

const TITULO = "Software CRM em Português | First Media CRM";
const DESCRICAO =
  "Pipeline de vendas, contactos e tarefas num CRM simples e em português. Nunca mais perca um follow-up. Conheça o First Media CRM.";
// O endereço público oficial. Fixo de propósito: é o que o Google guarda.
const SITE = "https://firstmediacrm.online";

// O título e a descrição vão também nas etiquetas que o Google, o Facebook, o
// LinkedIn e o WhatsApp leem quando alguém partilha o link. "canonical" diz ao
// Google qual é o endereço oficial desta página.
export const metadata = {
  metadataBase: new URL(SITE),
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "First Media CRM",
    locale: "pt_PT",
    title: TITULO,
    description: DESCRICAO,
    images: [{ url: "/logo-first-media.png", width: 526, height: 188, alt: "First Media" }],
  },
  twitter: { card: "summary", title: TITULO, description: DESCRICAO, images: ["/logo-first-media.png"] },
};

const DORES = [
  {
    titulo: "Contactos espalhados",
    texto: "Uns no Excel, outros no email, outros no WhatsApp. Ninguém sabe ao certo em que ponto está cada cliente.",
  },
  {
    titulo: "Follow-ups esquecidos",
    texto: "Ficou de ligar na terça e lembrou-se na sexta. Entretanto o cliente fechou com a concorrência.",
  },
  {
    titulo: "Vendas às escuras",
    texto: "Não sabe quanto vai fechar este mês, nem porque é que os negócios se perdem.",
  },
];

const FUNCIONALIDADES = [
  { titulo: "Funil de vendas", texto: "Veja todos os negócios por etapa e mude-os de etapa só a arrastar." },
  { titulo: "Tarefas com hora", texto: "Marque o próximo passo de cada contacto. Recebe um email 1 hora antes." },
  { titulo: "Calendário e reuniões", texto: "Tarefas e reuniões no mesmo calendário, por mês, semana ou dia." },
  { titulo: "Propostas anexadas", texto: "Guarde o PDF, Word ou Excel da proposta na ficha do contacto." },
  { titulo: "Relatórios", texto: "Taxa de conversão, valor ganho, motivos de perda e muito mais, com filtros." },
  { titulo: "Exportação para Excel", texto: "Leve os seus contactos e relatórios para Excel quando quiser." },
];

const INCLUIDO = [
  "Funil de vendas, contactos e tarefas",
  "Calendário e reuniões",
  "Lembretes por email",
  "Propostas anexadas",
  "Relatórios e exportação para Excel",
  "No computador e no telemóvel",
];

const PERGUNTAS = [
  {
    p: "Como funcionam os 14 dias grátis?",
    r: "Preenche o formulário, nós ativamos a sua conta e usa o CRM durante 14 dias sem pagar. No fim decide se continua.",
  },
  {
    p: "Preciso de instalar alguma coisa?",
    r: "Não. O First Media CRM funciona no browser, no computador e no telemóvel.",
  },
  {
    p: "Como é calculado o preço?",
    r: "29,99 € por mês por cada utilizador, com IVA incluído. Uma equipa de 3 pessoas paga 3 × 29,99 € por mês.",
  },
  {
    p: "Os meus colegas veem os meus contactos?",
    r: "Não. Cada utilizador vê apenas os seus próprios contactos, tarefas e reuniões.",
  },
  {
    p: "Posso tirar os meus dados?",
    r: "Sim. Exporta os seus contactos para Excel a qualquer momento.",
  },
];

// Um funil de exemplo, desenhado só com CSS (não é uma imagem).
const EXEMPLO = [
  { etapa: "Novo", cor: "#9BA1C2", cartoes: ["Padaria Lusa", "Atelier Norte"] },
  { etapa: "Em contacto", cor: "#F5A35C", cartoes: ["Clínica Sol"] },
  { etapa: "Proposta", cor: "#A4ACE9", cartoes: ["Hotel Ribeira", "Oficina Silva"] },
  { etapa: "Cliente", cor: "#5FD39B", cartoes: ["Café Central"] },
];

export default function Inicio() {
  return (
    <div className="lp">
      <header className="lp-topo">
        <div className="lp-largura lp-topo-linha">
          <a href="#inicio" className="lp-logo">
            <img src="/logo-first-media.png" alt="First Media" width={132} height={47} />
            <span>CRM</span>
          </a>
          <nav className="lp-nav" aria-label="Secções">
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#preco">Preço</a>
            <a href="#perguntas">Perguntas</a>
          </nav>
          <div className="lp-topo-acoes">
            <Link href="/login" className="lp-entrar">
              Entrar
            </Link>
            <a href="#experimentar" className="botao lp-botao-topo">
              Experimentar grátis
            </a>
          </div>
        </div>
      </header>

      <main id="inicio">
        {/* 1. Atenção */}
        <section className="lp-heroi lp-largura">
          <div>
            <p className="lp-sobretitulo">CRM simples, em português</p>
            <h1>
              Nunca mais perca um <em>follow-up</em>.
            </h1>
            <p className="lp-lead">
              O First Media CRM junta o pipeline de vendas, os contactos e as tarefas num só lugar. Feito para Empresas em
              Portugal que querem vender mais sem complicar.
            </p>
            <div className="lp-acoes">
              <a href="#experimentar" className="botao lp-botao-grande">
                Experimentar 14 dias grátis
              </a>
              <a href="#preco" className="lp-secundario">
                Ver preço
              </a>
            </div>
            <p className="lp-nota">14 dias grátis · depois 29,99 € por utilizador/mês, IVA incluído</p>
          </div>

          <div className="lp-funil" aria-hidden="true">
            {EXEMPLO.map((coluna) => (
              <div key={coluna.etapa} className="lp-coluna">
                <p className="lp-coluna-titulo" style={{ color: coluna.cor }}>
                  {coluna.etapa}
                </p>
                {coluna.cartoes.map((c) => (
                  <div key={c} className="lp-cartao-exemplo" style={{ borderLeftColor: coluna.cor }}>
                    {c}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* 2. Interesse: o problema */}
        <section className="lp-seccao lp-largura">
          <h2>Soa familiar?</h2>
          <div className="lp-grelha-3">
            {DORES.map((d) => (
              <div key={d.titulo} className="lp-bloco">
                <h3>{d.titulo}</h3>
                <p>{d.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Desejo: a solução */}
        <section id="funcionalidades" className="lp-seccao lp-largura">
          <p className="lp-sobretitulo">A solução</p>
          <h2>Tudo o que a sua equipa comercial precisa. Nada do que não precisa.</h2>
          <div className="lp-grelha-3">
            {FUNCIONALIDADES.map((f) => (
              <div key={f.titulo} className="lp-bloco">
                <span className="lp-marca" aria-hidden="true" />
                <h3>{f.titulo}</h3>
                <p>{f.texto}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-seccao lp-largura">
          <h2>Comece em 3 passos</h2>
          <ol className="lp-passos">
            <li>
              <strong>Peça os 14 dias grátis</strong>
              <span>Preencha o formulário no fim desta página.</span>
            </li>
            <li>
              <strong>Adicione os seus contactos</strong>
              <span>E arraste cada um pelas etapas do funil.</span>
            </li>
            <li>
              <strong>Feche mais negócios</strong>
              <span>O CRM lembra-o do próximo passo, a tempo.</span>
            </li>
          </ol>
        </section>

        {/* 4. Ação: preço e formulário */}
        <section id="preco" className="lp-seccao lp-largura">
          <p className="lp-sobretitulo">Preço</p>
          <h2>Um preço simples, sem surpresas.</h2>
          <div className="lp-preco">
            <p className="lp-preco-etiqueta">14 dias grátis</p>
            <p className="lp-preco-valor">
              29,99 €<span> / utilizador / mês</span>
            </p>
            <p className="lp-preco-iva">IVA incluído</p>
            <ul>
              {INCLUIDO.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
            <a href="#experimentar" className="botao lp-botao-grande">
              Experimentar 14 dias grátis
            </a>
          </div>
        </section>

        <section id="perguntas" className="lp-seccao lp-largura lp-estreito">
          <h2>Perguntas frequentes</h2>
          {PERGUNTAS.map((q) => (
            <details key={q.p} className="lp-pergunta">
              <summary>{q.p}</summary>
              <p>{q.r}</p>
            </details>
          ))}
        </section>

        <section id="experimentar" className="lp-seccao lp-largura lp-estreito">
          <p className="lp-sobretitulo">14 dias grátis</p>
          <h2>Experimente o First Media CRM</h2>
          <p className="lp-lead">Deixe os seus dados e ativamos a sua conta de experiência.</p>
          <div className="lp-caixa-form">
            <FormLead />
          </div>
        </section>
      </main>

      <footer className="lp-rodape">
        <div className="lp-largura lp-rodape-linha">
          <span>© First Media</span>
          <span className="lp-rodape-links">
            <Link href="/privacidade">Política de privacidade</Link>
            <Link href="/login">Entrar no CRM</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
