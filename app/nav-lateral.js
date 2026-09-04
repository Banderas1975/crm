"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

// As áreas do sistema. Para crescer, basta acrescentar aqui.
const AREAS = [
  { nome: "Dashboard", caminho: "/" },
  { nome: "Funil", caminho: "/funil" },
  { nome: "Contatos", caminho: "/contatos" },
  { nome: "Usuários", caminho: "/usuarios", soAdmin: true },
];

// Só funciona dentro de um <Link>: fica true enquanto a área nova não chega.
function Pendente() {
  const { pending } = useLinkStatus();
  return pending ? <span className="nav-pendente" aria-label="a carregar" /> : null;
}

export default function NavLateral({ admin }) {
  const caminho = usePathname();

  // A página de um contato vive dentro da área Contatos, e deve acendê-la.
  // O Dashboard é "/" e por isso tem de bater exato, senão acendia sempre.
  const atual = (area) =>
    area === "/" ? caminho === "/" : caminho === area || caminho.startsWith(area + "/");

  return (
    <nav className="barra-lateral">
      <p className="nav-titulo">Áreas</p>
      <div className="nav-lista">
        {AREAS.filter((area) => !area.soAdmin || admin).map((area) => (
          <Link
            key={area.caminho}
            href={area.caminho}
            className={atual(area.caminho) ? "nav-item ativo" : "nav-item"}
            aria-current={atual(area.caminho) ? "page" : undefined}
          >
            {area.nome}
            <Pendente />
          </Link>
        ))}
      </div>
    </nav>
  );
}
