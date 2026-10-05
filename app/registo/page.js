import Link from "next/link";
import { registar } from "../sessao-actions";
import { LIMITES } from "../../lib/validacao";
import { INDICATIVOS } from "../indicativos";
import PopupRegisto from "../popup-registo";
import CampoSenha from "../campo-senha";

export const metadata = { title: "Criar conta — First Media CRM" };

const ERROS = {
  nome: "Escreva o seu nome.",
  telefone: "Escreva um telefone válido, sem o indicativo. Os portugueses têm 9 dígitos.",
  email: "Escreva um email válido.",
  senha: "A senha tem de ter pelo menos 8 caracteres.",
  repetido: "Já existe uma conta com esse email.",
  geral: "Não foi possível criar a conta. Tente de novo.",
};

export default async function Registo({ searchParams }) {
  const { erro, concluido } = await searchParams;

  return (
    <main className="pagina pagina-login">
      {concluido && <PopupRegisto />}
      <header className="cabecalho">
        <h1>Criar conta</h1>
        <p className="apoio">A conta fica à espera de aprovação do administrador.</p>
      </header>

      <section className="cartao">
        <form action={registar}>
          <div className="campo">
            <label htmlFor="nome">Nome</label>
            <input id="nome" name="nome" type="text" required maxLength={LIMITES.nome} autoComplete="name" autoFocus />
          </div>

          <div className="campo">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required maxLength={LIMITES.email} autoComplete="email" />
          </div>

          <div className="campo">
            <label htmlFor="telefone">Telefone</label>
            <div className="campo-empilhado">
              <select name="indicativo" defaultValue="+351" aria-label="Indicativo do país">
                {INDICATIVOS.map(({ pais, codigo }) => (
                  <option key={pais} value={codigo}>
                    {pais} ({codigo})
                  </option>
                ))}
              </select>
              <input
                id="telefone"
                name="telefone"
                type="tel"
                inputMode="tel"
                required
                autoComplete="tel-national"
                placeholder="912345678"
                pattern="[ ]*([0-9][ ]*){4,15}"
                title="Escreva só os dígitos do número, sem o indicativo do país."
              />
            </div>
          </div>

          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <CampoSenha id="senha" name="senha" minLength={8} maxLength={LIMITES.senha} autoComplete="new-password" />
            <p className="ajuda">Pelo menos 8 caracteres.</p>
          </div>

          {erro && (
            <p className="erro" aria-live="polite">
              {ERROS[erro] ?? ERROS.geral}
            </p>
          )}

          <button className="botao">Criar conta</button>
        </form>

        <p className="apoio rodape-form">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </section>
    </main>
  );
}
