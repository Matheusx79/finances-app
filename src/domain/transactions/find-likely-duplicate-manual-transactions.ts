import type { TransactionType } from "@/domain/transactions/types";

// "exact" = already imported before (hash/fitid match, `findExistingExternalIds`).
// "fuzzy" = likely the same purchase as an existing manual quick-add, matched
// by same account/amount/type within the ADR-0005 date window, not a certain
// duplicate. null = no duplicate signal at all.
export type DuplicateKind = "exact" | "fuzzy" | null;

export type ManualTransactionCandidate = {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
};

export type ImportRowForDuplicateMatching = {
  date: string;
  amount: number;
  type: TransactionType;
};

// ADR-0005: fuzzy dedup for import rows against manually quick-added
// transactions the exact hash-based dedup can't see (different description,
// possibly a settled date a few days off the purchase date). ±5 days —
// tighter than YNAB's researched ±10-day window — to avoid false-positiving
// same-amount small recurring purchases (coffee, lunch) within a short span.
const DUPLICATE_WINDOW_DAYS = 5;

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.abs(new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()) / msPerDay;
}

function shiftDate(date: string, deltaDays: number): string {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + deltaDays);
  return shifted.toISOString().slice(0, 10);
}

/**
 * The [minDate, maxDate] range that could contain a fuzzy-match candidate
 * for any row in the batch — each row's own date ± the matching window,
 * widened to cover the whole batch in a single query rather than one query
 * per row.
 */
export function dateWindowForBatch(
  dates: string[],
): { minDate: string; maxDate: string } | null {
  if (dates.length === 0) return null;
  const sorted = [...dates].sort();
  return {
    minDate: shiftDate(sorted[0], -DUPLICATE_WINDOW_DAYS),
    maxDate: shiftDate(sorted[sorted.length - 1], DUPLICATE_WINDOW_DAYS),
  };
}

/**
 * For each row, finds the closest-dated manual transaction candidate with
 * the same type and amount within `DUPLICATE_WINDOW_DAYS`, or null. Each row
 * is matched independently against the full candidate list — a candidate
 * can be "found" for more than one row if the data is genuinely ambiguous
 * (e.g. two same-amount purchases close together); this is an accepted
 * tradeoff of a heuristic flag-only match (see ADR-0005), not a bug to fix
 * with a 1:1 assignment algorithm.
 */
export function findLikelyDuplicateManualTransactions(
  rows: ImportRowForDuplicateMatching[],
  candidates: ManualTransactionCandidate[],
): (string | null)[] {
  return rows.map((row) => {
    let best: ManualTransactionCandidate | null = null;
    let bestDistance = Infinity;

    for (const candidate of candidates) {
      if (candidate.type !== row.type || candidate.amount !== row.amount) continue;
      const distance = daysBetween(row.date, candidate.date);
      if (distance > DUPLICATE_WINDOW_DAYS) continue;
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }

    return best?.id ?? null;
  });
}

/**
 * Combines the exact hash-based check (already computed by the caller) with
 * the fuzzy match above into the per-row `DuplicateKind` the staging screen
 * displays — exact wins over fuzzy, and only rows that aren't already an
 * exact match spend a fuzzy lookup. Pulled out as its own pure function
 * (rather than living inline in the "use server" action) so the index
 * bookkeeping that re-aligns the filtered fuzzy-candidate list back onto the
 * original row order has a direct test, independent of the DB fetch.
 */
export function classifyDuplicateKinds(
  rows: ImportRowForDuplicateMatching[],
  isExactDuplicate: boolean[],
  candidates: ManualTransactionCandidate[],
): DuplicateKind[] {
  const fuzzyCandidateRows = rows.filter((_, i) => !isExactDuplicate[i]);
  const fuzzyMatches = findLikelyDuplicateManualTransactions(fuzzyCandidateRows, candidates);

  let fuzzyIndex = 0;
  return rows.map((_, i) => {
    if (isExactDuplicate[i]) return "exact";
    return fuzzyMatches[fuzzyIndex++] ? "fuzzy" : null;
  });
}
