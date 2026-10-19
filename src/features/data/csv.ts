/** Minimal RFC 4180 CSV: quoted fields, doubled quotes, CRLF or LF line ends. */

const FORMULA_START = /^[=+\-@\t\r]/;

/** Cells starting like a formula get a leading apostrophe so spreadsheets show text. */
export function escapeFormula(value: string): string {
  return FORMULA_START.test(value) ? `'${value}` : value;
}

/** Reverses `escapeFormula` on import. */
export function unescapeFormula(value: string): string {
  return value.startsWith("'") && FORMULA_START.test(value.slice(1)) ? value.slice(1) : value;
}

function quote(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(header: readonly string[], rows: readonly (readonly string[])[]): string {
  const lines = [header, ...rows].map((cells) =>
    cells.map((c) => quote(escapeFormula(c))).join(','),
  );
  return lines.join('\r\n') + '\r\n';
}

/** Parses CSV text into rows of cells. Throws on an unterminated quote. */
export function parseCsv(text: string): string[][] {
  const src = text.startsWith('﻿') ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  let i = 0;
  while (i < src.length) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        quoted = false;
      } else cell += ch;
      i++;
      continue;
    }
    if (ch === '"' && cell === '') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      if (ch === '\r' && src[i + 1] === '\n') i++;
    } else cell += ch;
    i++;
  }
  if (quoted) throw new Error('Unterminated quoted field');
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}
