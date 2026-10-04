"use client";

import { useActionState } from "react";
import { guardarSmtp, testarSmtp } from "./backend-actions";
import CampoSenha from "./campo-senha";
import { LIMITES } from "../lib/validacao";

export default function FormSmtp({ config, portas, emailConta }) {
  const [estado, acao, guardando] = useActionState(guardarSmtp, { erro: "" });
  const [teste, acaoTeste, aTestar] = useActionState(testarSmtp, { erro: "" });
  // Depois de um erro, os valores escritos; senão, os guardados.
  const c = estado.valores ?? config ?? {};

  return (
    <>
      {/* Um formulário novo a cada resposta: assim a porta (um <select>) também
          volta ao valor certo — o React só aplica o valor inicial de um select ao criá-lo. */}
      <form action={acao} key={estado.n ?? 0}>
        <div className="smtp-grelha">
          <div className="campo">
            <label htmlFor="remetente_nome">Nome do remetente</label>
            <input id="remetente_nome" name="remetente_nome" maxLength={120} defaultValue={c.remetente_nome ?? ""} placeholder="Ana Silva — First Media" autoComplete="name" />
          </div>
          <div className="campo">
            <label htmlFor="remetente_email">Email do remetente</label>
            <input id="remetente_email" name="remetente_email" type="email" required maxLength={LIMITES.email} defaultValue={c.remetente_email ?? ""} placeholder="ana@firstmedia.pt" autoComplete="email" />
          </div>
          <div className="campo">
            <label htmlFor="servidor">Servidor SMTP</label>
            <input id="servidor" name="servidor" required maxLength={200} defaultValue={c.servidor ?? ""} placeholder="smtp.exemplo.pt" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
          </div>
          <div className="campo">
            <label htmlFor="porta">Porta e segurança</label>
            <select id="porta" name="porta" defaultValue={c.porta ?? 465}>
              {portas.map((p) => (
                <option key={p.porta} value={p.porta}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="utilizador">Utilizador</label>
            <input id="utilizador" name="utilizador" required maxLength={200} defaultValue={c.utilizador ?? ""} placeholder="ana@firstmedia.pt" autoComplete="off" autoCapitalize="off" spellCheck={false} />
          </div>
          <div className="campo">
            <label htmlFor="senha">Password</label>
            <CampoSenha
              id="senha"
              name="senha"
              maxLength={LIMITES.senha}
              autoComplete="new-password"
              required={!config}
              placeholder={config ? "Guardada — escreva só para mudar" : ""}
            />
          </div>
        </div>

        {estado.erro && (
          <p className="erro" aria-live="polite">
            {estado.erro}
          </p>
        )}
        {!guardando && estado.salvo > 0 && !estado.erro && (
          <p className="ajuda" aria-live="polite">
            Guardado. Agora envie um email de teste.
          </p>
        )}

        <button className="botao botao-pequeno" disabled={guardando}>
          {guardando ? "A guardar..." : "Guardar configuração"}
        </button>
      </form>

      {config && (
        <form action={acaoTeste} className="teste-email">
          <button className="botao-contorno" disabled={aTestar}>
            {aTestar ? "A enviar..." : "Enviar email de teste"}
          </button>
          <p className="ajuda">O teste sai da caixa configurada acima e chega a {emailConta}.</p>
          {teste.erro && (
            <p className="erro" aria-live="polite">
              {teste.erro}
            </p>
          )}
          {teste.aviso && (
            <p className="aviso" aria-live="polite">
              {teste.aviso}
            </p>
          )}
        </form>
      )}
    </>
  );
}
