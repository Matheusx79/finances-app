import Link from "next/link";
import { Button } from "@/components/ui/button";

/** e.g. "julho de 2026" — display-only, not used for date storage/comparison. */
export function formatMonthYearBR(year: number, month: number): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}

/** Adds `delta` months to `{ year, month }`, wrapping the year at Dec/Jan in either direction. */
function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const zeroBasedTotal = year * 12 + (month - 1) + delta;
  return { year: Math.floor(zeroBasedTotal / 12), month: (((zeroBasedTotal % 12) + 12) % 12) + 1 };
}

/**
 * Resolves the `ano`/`mes` query params used across the dashboard and
 * transactions pages into a concrete `{ year, month }`, defaulting to the
 * current calendar month when absent or malformed — never throws, so an
 * unparseable/out-of-range param just falls back instead of erroring.
 */
export function resolveMonthParams(ano?: string, mes?: string): { year: number; month: number } {
  const now = new Date();
  const fallback = { year: now.getFullYear(), month: now.getMonth() + 1 };

  if (!ano || !mes) return fallback;

  const year = Number.parseInt(ano, 10);
  const month = Number.parseInt(mes, 10);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return fallback;
  }
  return { year, month };
}

/** "julho de 2026" -> "Julho de 2026" — only the leading letter, not Tailwind's per-word `capitalize`. */
function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildMonthHref(
  basePath: string,
  year: number,
  month: number,
  extraParams?: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  params.set("ano", String(year));
  params.set("mes", String(month));
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) params.set(key, value);
    }
  }
  return `${basePath}?${params.toString()}`;
}

/**
 * Prev/next month navigation, expressed as plain links so the page stays
 * server-rendered (mirrors `PersonFilter`'s Link-rendered-Button approach).
 * `extraParams` lets callers preserve other filters (e.g. `responsavel`) when
 * the month changes.
 */
export function MonthNav({
  year,
  month,
  basePath,
  extraParams,
}: {
  year: number;
  month: number;
  basePath: string;
  extraParams?: Record<string, string | undefined>;
}) {
  const previous = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <div className="flex items-center justify-center gap-3" role="group" aria-label="Navegar por mês">
      <Button
        render={
          <Link href={buildMonthHref(basePath, previous.year, previous.month, extraParams)}>
            Mês anterior
          </Link>
        }
        nativeButton={false}
        variant="outline"
        size="sm"
      />
      <span className="min-w-[9rem] text-center text-sm font-medium">
        {capitalizeFirst(formatMonthYearBR(year, month))}
      </span>
      <Button
        render={
          <Link href={buildMonthHref(basePath, next.year, next.month, extraParams)}>
            Próximo mês
          </Link>
        }
        nativeButton={false}
        variant="outline"
        size="sm"
      />
    </div>
  );
}
