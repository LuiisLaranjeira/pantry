export function formatCurrency(value: number): string {
  return `€${value.toFixed(2)}`;
}

/**
 * UTF-8 byte-order mark. Prepend to exported text files so spreadsheet apps
 * (notably Excel on Windows) read them as UTF-8 and render accented characters
 * correctly instead of mojibake.
 */
export const UTF8_BOM = String.fromCharCode(0xfeff);

export function toCSV(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
