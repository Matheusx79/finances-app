/** BRL currency formatting — the app's single currency (per spec, no multi-currency support). */
export function formatBRL(amount: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

/**
 * Formats a `date` column value (a plain "YYYY-MM-DD" string, no time/zone
 * component) as pt-BR "DD/MM/YYYY". Deliberately a string split rather than
 * `new Date(isoDate)` + `toLocaleDateString` — parsing "YYYY-MM-DD" as a
 * `Date` treats it as UTC midnight, which can shift a day in either
 * direction depending on the reader's local timezone offset.
 */
export function formatDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}
