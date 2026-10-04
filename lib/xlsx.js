// Gera um ficheiro .xlsx com uma folha, sem biblioteca nenhuma.
// Um .xlsx é um ZIP com meia dúzia de ficheiros XML lá dentro; escrevemos
// esses XML e o ZIP à mão. Menos código de terceiros a correr no servidor.
//
// O texto vai sempre como texto (inlineStr) e os números como números: o Excel
// nunca lê nada como fórmula, por isso um nome começado por "=" não executa
// nada quando se abre o ficheiro — e os valores continuam a poder somar-se.
import { deflateRawSync, crc32 } from "node:zlib";

// Caracteres que o XML não aceita (controlo), fora as quebras de linha e o tab.
const INVALIDOS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

const escapar = (texto) =>
  String(texto ?? "")
    .replace(INVALIDOS, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// 0 → A, 25 → Z, 26 → AA
function coluna(n) {
  let nome = "";
  for (n += 1; n > 0; n = Math.floor((n - 1) / 26)) nome = String.fromCharCode(65 + ((n - 1) % 26)) + nome;
  return nome;
}

function folha(cabecalho, linhas, larguras) {
  const celula = (valor, c, l, estilo) =>
    typeof valor === "number" && Number.isFinite(valor)
      ? `<c r="${coluna(c)}${l}"${estilo ? ` s="${estilo}"` : ""}><v>${valor}</v></c>`
      : `<c r="${coluna(c)}${l}" t="inlineStr"${estilo ? ` s="${estilo}"` : ""}><is><t xml:space="preserve">${escapar(valor)}</t></is></c>`;
  const linha = (valores, l, estilo) =>
    `<row r="${l}">${valores.map((v, c) => celula(v, c, l, estilo)).join("")}</row>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>${larguras.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>
<sheetData>${linha(cabecalho, 1, 1)}${linhas.map((valores, i) => linha(valores, i + 2)).join("")}</sheetData>
</worksheet>`;
}

const FICHEIROS_FIXOS = (nomesFolhas) => ({
  "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${nomesFolhas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("\n")}
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
  "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
  "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${nomesFolhas.map((nome, i) => `<sheet name="${escapar(nome)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>
</workbook>`,
  "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${nomesFolhas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("\n")}
<Relationship Id="rId${nomesFolhas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
  // Estilo 0: normal. Estilo 1: negrito, para a linha do cabeçalho.
  "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`,
});

// Data dos ficheiros dentro do ZIP: 1 de janeiro de 1980, a primeira que o
// formato aceita. Zero não é uma data válida e alguns programas queixam-se.
const DATA_ZIP = (1 << 5) | 1;

// ZIP simples: cada ficheiro comprimido (deflate), cabeçalho local + índice central.
function zip(ficheiros) {
  const locais = [];
  const centrais = [];
  let posicao = 0;

  for (const [nome, conteudo] of Object.entries(ficheiros)) {
    const nomeBytes = Buffer.from(nome, "utf8");
    const dados = Buffer.from(conteudo, "utf8");
    const comprimido = deflateRawSync(dados);
    const crc = crc32(dados);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // assinatura
    local.writeUInt16LE(20, 4); // versão necessária
    local.writeUInt16LE(0x0800, 6); // nomes em UTF-8
    local.writeUInt16LE(8, 8); // método: deflate
    local.writeUInt16LE(0, 10); // hora
    local.writeUInt16LE(DATA_ZIP, 12); // data
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comprimido.length, 18);
    local.writeUInt32LE(dados.length, 22);
    local.writeUInt16LE(nomeBytes.length, 26);
    local.writeUInt16LE(0, 28);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // feito por
    central.writeUInt16LE(20, 6); // versão necessária
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(DATA_ZIP, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(comprimido.length, 20);
    central.writeUInt32LE(dados.length, 24);
    central.writeUInt16LE(nomeBytes.length, 28);
    central.writeUInt32LE(posicao, 42); // onde começa o cabeçalho local

    locais.push(local, nomeBytes, comprimido);
    centrais.push(central, nomeBytes);
    posicao += local.length + nomeBytes.length + comprimido.length;
  }

  const indice = Buffer.concat(centrais);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(Object.keys(ficheiros).length, 8);
  fim.writeUInt16LE(Object.keys(ficheiros).length, 10);
  fim.writeUInt32LE(indice.length, 12);
  fim.writeUInt32LE(posicao, 16);

  return Buffer.concat([...locais, indice, fim]);
}

// Uma folha: { nomeFolha, cabecalho: ["Nome", ...], linhas: [["Ana", ...], ...], larguras }.
// Várias: { folhas: [{ nomeFolha, cabecalho, linhas, larguras }, ...] }.
// Larguras em caracteres. Nomes de folha: no máximo 31 caracteres (regra do Excel).
export function gerarXlsx(pedido) {
  const folhas = pedido.folhas ?? [pedido];
  const ficheiros = FICHEIROS_FIXOS(folhas.map((f) => f.nomeFolha.slice(0, 31)));
  folhas.forEach((f, i) => {
    ficheiros[`xl/worksheets/sheet${i + 1}.xml`] = folha(f.cabecalho, f.linhas, f.larguras);
  });
  return zip(ficheiros);
}
