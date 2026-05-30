export function formatCurrency(value: number): string {
  return `€${value.toFixed(2)}`;
}

export function toCSV(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
