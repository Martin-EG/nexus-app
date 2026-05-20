/**
 * Formats the API's free-form date values consistently as `DD/MM/YYYY`.
 *
 * The backend stores dates as plain text in mixed formats — `dd/mm/yyyy`,
 * ISO (`2025-04-04`), or Unix epoch seconds (`1735862400`). This normalizes
 * any of them; empty or unparseable values render as `—`.
 */
export function formatDate(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === '') return '—';

  const text = String(value);

  // Already DD/MM/YYYY.
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return text;

  let date: Date | null = null;
  if (/^\d+$/.test(text)) {
    // Unix epoch seconds.
    date = new Date(Number(text) * 1000);
  } else {
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  }

  if (!date || Number.isNaN(date.getTime())) return '—';

  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getUTCFullYear()}`;
}
