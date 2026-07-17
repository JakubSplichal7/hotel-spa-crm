/** Minimal .xlsx writer (Open XML) — no third-party deps. */

type CellValue = string | number | boolean | null | undefined;

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function colName(index: number): string {
  let n = index + 1;
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function sheetXml(rows: CellValue[][]): string {
  const sheetRows = rows
    .map((row, rIdx) => {
      const cells = row
        .map((cell, cIdx) => {
          const ref = `${colName(cIdx)}${rIdx + 1}`;
          if (cell === null || cell === undefined || cell === "") {
            return `<c r="${ref}"/>`;
          }
          if (typeof cell === "number" && Number.isFinite(cell)) {
            return `<c r="${ref}"><v>${cell}</v></c>`;
          }
          if (typeof cell === "boolean") {
            return `<c r="${ref}" t="b"><v>${cell ? 1 : 0}</v></c>`;
          }
          const text = xmlEscape(String(cell));
          return `<c r="${ref}" t="inlineStr"><is><t>${text}</t></is></c>`;
        })
        .join("");
      return `<row r="${rIdx + 1}">${cells}</row>`;
    })
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetData>${sheetRows}</sheetData>` +
    `</worksheet>`
  );
}

/** CRC32 for ZIP local/central headers */
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(n: number): Uint8Array {
  const b = new Uint8Array(2);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  return b;
}

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  b[2] = (n >>> 16) & 0xff;
  b[3] = (n >>> 24) & 0xff;
  return b;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function zipStore(files: { path: string; data: Uint8Array }[]): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const crc = crc32(file.data);
    const size = file.data.length;

    const localHeader = concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
    ]);

    localParts.push(localHeader, file.data);

    const centralHeader = concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ]);
    centralParts.push(centralHeader);
    offset += localHeader.length + size;
  }

  const central = concat(centralParts);
  const local = concat(localParts);
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(central.length),
    u32(local.length),
    u16(0),
  ]);

  return concat([local, central, end]);
}

/**
 * Build an .xlsx ArrayBuffer from a header row + data rows
 * (or from objects via `rowsFromRecords`).
 */
export function buildXlsx(rows: CellValue[][]): Uint8Array {
  const encoder = new TextEncoder();
  const files = [
    {
      path: "[Content_Types].xml",
      data: encoder.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
          `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
          `<Default Extension="xml" ContentType="application/xml"/>` +
          `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
          `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
          `</Types>`
      ),
    },
    {
      path: "_rels/.rels",
      data: encoder.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
          `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
          `</Relationships>`
      ),
    },
    {
      path: "xl/workbook.xml",
      data: encoder.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
          `<sheets><sheet name="Export" sheetId="1" r:id="rId1"/></sheets>` +
          `</workbook>`
      ),
    },
    {
      path: "xl/_rels/workbook.xml.rels",
      data: encoder.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
          `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
          `</Relationships>`
      ),
    },
    {
      path: "xl/worksheets/sheet1.xml",
      data: encoder.encode(sheetXml(rows)),
    },
  ];

  return zipStore(files);
}

export function rowsFromRecords(
  records: Record<string, CellValue>[],
  columns?: string[]
): CellValue[][] {
  if (!records.length) {
    return [columns || []];
  }
  const keys = columns || Object.keys(records[0]);
  return [keys, ...records.map((row) => keys.map((k) => row[k] ?? ""))];
}

export function downloadXlsx(filename: string, rows: CellValue[][]) {
  const bytes = buildXlsx(rows);
  triggerDownload(filename, "xlsx", bytes, XLSX_MIME);
}

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function safeBaseName(filename: string): string {
  return filename.replace(/[\\/:*?"<>|]+/g, "-").trim() || "export";
}

function triggerDownload(
  filename: string,
  ext: string,
  data: BlobPart,
  mime: string
) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const base = safeBaseName(filename).replace(/\.(xlsx|pdf|xml)$/i, "");
  a.download = `${base}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function xmlTagName(header: string, index: number): string {
  let name = header
    .trim()
    .replace(/[^\w.-]+/g, "_")
    .replace(/^[^A-Za-z_]/, "_");
  if (!name) name = `col_${index + 1}`;
  return name;
}

/** Simple tabular XML export */
export function buildXml(rows: CellValue[][]): string {
  const [headers = [], ...data] = rows;
  const tags = headers.map((h, i) => xmlTagName(String(h ?? `col_${i + 1}`), i));

  const body = data
    .map((row) => {
      const fields = tags
        .map((tag, i) => {
          const raw = row[i];
          const text =
            raw === null || raw === undefined ? "" : xmlEscape(String(raw));
          return `    <${tag}>${text}</${tag}>`;
        })
        .join("\n");
      return `  <row>\n${fields}\n  </row>`;
    })
    .join("\n");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<export generatedAt="${new Date().toISOString()}">\n` +
    `${body}\n` +
    `</export>\n`
  );
}

export function downloadXml(filename: string, rows: CellValue[][]) {
  triggerDownload(filename, "xml", buildXml(rows), "application/xml;charset=utf-8");
}

function pdfEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Fold to Latin-1-ish ASCII so Helvetica PDF stays valid (xlsx/xml keep Unicode). */
function toPdfSafe(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");
}

function cellText(value: CellValue): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

/** Minimal multi-page PDF table (Helvetica). */
export function buildPdf(rows: CellValue[][], title = "Export"): Uint8Array {
  const pageWidth = 842; // A4 landscape
  const pageHeight = 595;
  const margin = 36;
  const fontSize = 8;
  const lineHeight = 11;
  const usableWidth = pageWidth - margin * 2;

  const [headers = [], ...dataRows] = rows;
  const colCount = Math.max(headers.length, 1);
  const colWidth = usableWidth / colCount;

  const encoder = new TextEncoder();
  const pages: string[] = [];

  function drawTablePage(pageRows: CellValue[][]): string {
    const lines: string[] = [];
    lines.push("BT");
    let y = pageHeight - margin;

    const drawRow = (row: CellValue[], font: "F1" | "F2") => {
      lines.push(`/${font} ${font === "F2" ? 8 : fontSize} Tf`);
      for (let c = 0; c < colCount; c++) {
        const x = margin + c * colWidth;
        const maxChars = Math.max(4, Math.floor(colWidth / 4.5));
        let text = toPdfSafe(cellText(row[c]));
        if (text.length > maxChars) text = `${text.slice(0, maxChars - 1)}...`;
        lines.push(
          `1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(text)}) Tj`
        );
      }
      y -= lineHeight;
    };

    lines.push(`/F2 11 Tf`);
    lines.push(
      `1 0 0 1 ${margin.toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(toPdfSafe(title))}) Tj`
    );
    y -= lineHeight + 4;
    drawRow(headers, "F2");
    y -= 2;

    for (const row of pageRows) {
      if (y < margin + lineHeight) break;
      drawRow(row, "F1");
    }

    lines.push("ET");
    return lines.join("\n");
  }

  let remaining = [...dataRows];
  do {
    const titleSpace = lineHeight + 4;
    const headerSpace = lineHeight + 2;
    const available = pageHeight - margin * 2 - titleSpace - headerSpace;
    const rowsPerPage = Math.max(1, Math.floor(available / lineHeight));
    const chunk = remaining.splice(0, rowsPerPage);
    pages.push(drawTablePage(chunk));
  } while (remaining.length > 0);

  if (pages.length === 0) {
    pages.push(drawTablePage([]));
  }

  const objects: string[] = [];
  const fontF1 = 3;
  const fontF2 = 4;
  let nextObj = 5;
  const pageObjectNumbers: number[] = [];

  for (const content of pages) {
    const contentObj = nextObj++;
    const pageObj = nextObj++;
    pageObjectNumbers.push(pageObj);

    objects[contentObj] =
      `${contentObj} 0 obj\n<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream\nendobj\n`;

    objects[pageObj] =
      `${pageObj} 0 obj\n` +
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
      `/Resources << /Font << /F1 ${fontF1} 0 R /F2 ${fontF2} 0 R >> >> ` +
      `/Contents ${contentObj} 0 R >>\nendobj\n`;
  }

  objects[1] = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  objects[3] =
    `3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
  objects[4] =
    `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`;

  const kidsRef = pageObjectNumbers.map((n) => `${n} 0 R`).join(" ");
  objects[2] =
    `2 0 obj\n<< /Type /Pages /Kids [${kidsRef}] /Count ${pageObjectNumbers.length} >>\nendobj\n`;

  const parts: Uint8Array[] = [];
  const header = encoder.encode("%PDF-1.4\n");
  parts.push(header);
  let offset = header.length;
  const offsets: number[] = [0];

  const maxObj = nextObj - 1;
  for (let i = 1; i <= maxObj; i++) {
    offsets[i] = offset;
    const chunk = encoder.encode(objects[i]);
    parts.push(chunk);
    offset += chunk.length;
  }

  const xrefStart = offset;
  let xref = `xref\n0 ${maxObj + 1}\n`;
  xref += `0000000000 65535 f \n`;
  for (let i = 1; i <= maxObj; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xref +=
    `trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefStart}\n%%EOF\n`;
  parts.push(encoder.encode(xref));

  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

export function downloadPdf(filename: string, rows: CellValue[][], title?: string) {
  const base = safeBaseName(filename).replace(/\.(xlsx|pdf|xml)$/i, "");
  const bytes = buildPdf(rows, title || base);
  triggerDownload(filename, "pdf", bytes, "application/pdf");
}

export type ExportFormat = "xlsx" | "pdf" | "xml";

export function downloadTableExport(
  format: ExportFormat,
  filename: string,
  rows: CellValue[][],
  title?: string
) {
  if (format === "xlsx") downloadXlsx(filename, rows);
  else if (format === "pdf") downloadPdf(filename, rows, title);
  else downloadXml(filename, rows);
}
