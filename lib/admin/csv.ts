/**
 * CSV export. Pure — no server-only deps, so the same code can build a file in
 * a route handler or a Blob in the browser.
 */

/**
 * Quote a single cell.
 *
 * The leading-apostrophe guard is not decoration: Excel and Google Sheets treat
 * a cell starting with `=`, `+`, `-` or `@` as a formula, so a company field of
 * `=HYPERLINK(...)` executes when staff opens the export. Prefixing a single
 * quote makes the spreadsheet read it as text and is invisible in the cell.
 */
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";

  let str = String(value);
  if (/^[=+\-@]/.test(str)) str = `'${str}`;

  // Escape embedded quotes by doubling, then wrap if the value contains
  // anything that would break the row.
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// `T` is left unconstrained on purpose. Constraining it to
// `Record<string, unknown>` reads as harmless but rejects every interface —
// an interface has no index signature, so `Application` and `Member` fail to
// satisfy it. `keyof T` already restricts the columns to real fields.
export function toCsv<T>(
  rows: T[],
  columns: { key: keyof T; label: string }[],
): string {
  const header = columns.map((c) => cell(c.label)).join(",");
  const body = rows.map((row) =>
    columns.map((c) => cell(row[c.key])).join(","),
  );

  // \r\n line endings — Excel on Windows treats a lone \n as one long row.
  // The BOM makes Excel read the file as UTF-8 rather than the local codepage,
  // which is what keeps accented names from arriving mangled.
  return "﻿" + [header, ...body].join("\r\n");
}

/** `Content-Disposition` value with a dated filename. */
export function csvFilename(base: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `attachment; filename="${base}-${stamp}.csv"`;
}
