import Link from "next/link";
import { cookies, headers } from "next/headers";
import FormLead from "../form-lead";
import Testemunhos from "../testemunhos";
import AvisoCookies, { GerirCookies } from "../aviso-cookies";
import { COOKIE_CONSENTIMENTO } from "../../lib/consentimento";
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
    r: "29,99 € por mês por cada utilizador, com IVA incluído. Uma equipa de 3 pessoas paga 3 × 29,99 € por mês. Também pode pagar por ano: 287 € por utilizador, com IVA incluído e 20% de desconto face ao mensal.",
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

// Testemunhos reais, autorizados pelos próprios. Só se corrigiu a ortografia.
const TESTEMUNHOS = [
  { nome: "Ana Margarida", texto: "CRM simples e em conta. Funcionalidades bem definidas e apresentação gráfica cuidada." },
  {
    nome: "Luís Apolónio",
    texto: "A minha funcionalidade preferida são as tarefas, pois o CRM pode avisar com antecedência via email as mesmas.",
  },
  {
    nome: "António Vasques",
    texto: "O facto de também funcionar em mobile é uma grande vantagem, assim sendo contratei um CRM que também cabe no bolso!",
  },
  {
    nome: "Carlos Casaca",
    texto:
      "Como as minhas reuniões são maioritariamente por videoconferência, a funcionalidade de aviso de reuniões por email é excelente.",
  },
  { nome: "Verónica Esteves", texto: "Fácil de utilizar, com um Kanban bem feito e com relatórios poderosos e exportáveis." },
  {
    nome: "Ricardo Barceló",
    texto: "É uma vantagem termos no backend a possibilidade de configurarmos o email que quisermos. Estou satisfeito!",
  },
];

// Um funil de exemplo, desenhado só com CSS (não é uma imagem).
const EXEMPLO = [
  { etapa: "Novo", cor: "#9BA1C2", cartoes: ["Padaria Lusa", "Atelier Norte"] },
  { etapa: "Em contacto", cor: "#F5A35C", cartoes: ["Clínica Sol"] },
  { etapa: "Proposta", cor: "#A4ACE9", cartoes: ["Hotel Ribeira", "Oficina Silva"] },
  { etapa: "Cliente", cor: "#5FD39B", cartoes: ["Café Central"] },
];

// Schema markup (JSON-LD): diz ao Google, em linguagem de máquina, o que é esta
// página — um software, o preço, quem o faz e as perguntas frequentes. Só leva
// o que a página já mostra: nada de avaliações ou números inventados.
const ESQUEMA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#organizacao`,
      name: "First Media",
      url: SITE,
      logo: `${SITE}/logo-first-media.png`,
      email: "crm@firstmedia.pt",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#site`,
      url: SITE,
      name: "First Media CRM",
      inLanguage: "pt-PT",
      publisher: { "@id": `${SITE}/#organizacao` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE}/#software`,
      name: "First Media CRM",
      description: DESCRICAO,
      url: SITE,
      image: `${SITE}/logo-first-media.png`,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "CRM",
      operatingSystem: "Web, Windows, macOS, Android, iOS",
      inLanguage: "pt-PT",
      featureList: FUNCIONALIDADES.map((f) => f.titulo),
      publisher: { "@id": `${SITE}/#organizacao` },
      // Os dois cartões da secção "Preço": mensal e anual.
      offers: [
        {
          "@type": "Offer",
          name: "Mensal",
          url: `${SITE}/#preco`,
          price: "29.99",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          description: "14 dias grátis. Depois, 29,99 € por utilizador por mês, IVA incluído.",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "29.99",
            priceCurrency: "EUR",
            valueAddedTaxIncluded: true,
            unitText: "utilizador por mês",
            billingDuration: "P1M",
          },
        },
        {
          "@type": "Offer",
          name: "Anual",
          url: `${SITE}/#preco`,
          price: "287",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          description: "14 dias grátis. Depois, 287 € por utilizador por ano, IVA incluído: 20% de desconto face ao mensal.",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "287",
            priceCurrency: "EUR",
            valueAddedTaxIncluded: true,
            unitText: "utilizador por ano",
            billingDuration: "P1Y",
          },
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE}/#perguntas`,
      inLanguage: "pt-PT",
      mainEntity: PERGUNTAS.map((q) => ({
        "@type": "Question",
        name: q.p,
        acceptedAnswer: { "@type": "Answer", text: q.r },
      })),
    },
  ],
};

// "<" escapado: nenhum texto consegue fechar a etiqueta <script> antes do tempo.
const ESQUEMA_JSON = JSON.stringify(ESQUEMA).replace(/</g, "\\u003c");

export default async function Inicio() {
  // O nonce da CSP (ver proxy.js), para o browser aceitar esta etiqueta <script>.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const consentimento = (await cookies()).get(COOKIE_CONSENTIMENTO)?.value;
  const escolha = ["estatisticas", "essenciais"].includes(consentimento) ? consentimento : null;

  return (
    <div className="lp">
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: ESQUEMA_JSON }} />
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
              <strong>Entre e registe-se</strong>
              <span>Rapidamente lhe damos acesso ao software</span>
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
          <div className="lp-precos">
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
            <div className="lp-preco">
              <p className="lp-preco-etiqueta">Anual · poupe 20%</p>
              <p className="lp-preco-valor">
                287 €<span> / utilizador / ano</span>
              </p>
              <p className="lp-preco-iva">IVA incluído · 20% de desconto face ao mensal</p>
              <ul>
                {INCLUIDO.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <a href="#experimentar" className="botao lp-botao-grande">
                Experimentar 14 dias grátis
              </a>
            </div>
          </div>
        </section>

        <section id="testemunhos" className="lp-seccao lp-largura">
          <p className="lp-sobretitulo">Testemunhos</p>
          <h2>O que dizem os nossos clientes</h2>
          <Testemunhos lista={TESTEMUNHOS} />
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
            <GerirCookies />
            <Link href="/login">Entrar no CRM</Link>
          </span>
        </div>
      </footer>

      <AvisoCookies escolha={escolha} />
    </div>
  );
}
