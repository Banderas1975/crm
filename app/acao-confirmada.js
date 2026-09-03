"use client";

// Botão que pergunta antes de fazer. Usado nas ações que tiram acesso
// ou dão poderes, onde um clique errado custa caro.
export default function AcaoConfirmada({ acao, id, pergunta, texto, className = "botao-texto" }) {
  return (
    <form
      action={acao}
      onSubmit={(e) => {
        if (!confirm(pergunta)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className={className}>{texto}</button>
    </form>
  );
}
