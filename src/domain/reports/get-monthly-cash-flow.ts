import type { SupabaseClient } from "@supabase/supabase-js";

/** Income/expense totals for one household member (or "shared", i.e. no owner) within a month. */
export type CashFlowOwnerTotals = {
  income: number;
  expense: number;
};

export type MonthlyCashFlow = {
  year: number;
  month: number;
  /** Keyed by `owner_household_member_id`, or the literal "shared" for null-owner transactions. */
  totalsByOwner: Record<string, CashFlowOwnerTotals>;
};

const SHARED_KEY = "shared";

function monthsBackList(monthsBack: number): { year: number; month: number }[] {
  const now = new Date();
  const months: { year: number; month: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return months;
}

function monthKey(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, "0")}`;
}

/**
 * Monthly income/expense totals for the last `monthsBack` months (oldest
 * first), split by `owner_household_member_id` ("shared" for null owner).
 * Months with no transactions still appear with zero totals — the month
 * list is generated here, not derived from GROUP BY.
 */
export async function getMonthlyCashFlow(
  supabase: SupabaseClient,
  { householdId, monthsBack }: { householdId: string; monthsBack: number },
): Promise<MonthlyCashFlow[]> {
  const months = monthsBackList(monthsBack);
  const startDate = `${months[0].year.toString().padStart(4, "0")}-${months[0].month
    .toString()
    .padStart(2, "0")}-01`;
  const lastMonth = months[months.length - 1];
  const endYear = lastMonth.month === 12 ? lastMonth.year + 1 : lastMonth.year;
  const endMonth = lastMonth.month === 12 ? 1 : lastMonth.month + 1;
  const endDate = `${endYear.toString().padStart(4, "0")}-${endMonth.toString().padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("transactions")
    .select("date, type, amount, owner_household_member_id")
    .eq("household_id", householdId)
    .gte("date", startDate)
    .lt("date", endDate);
  if (error) throw error;

  const rows = data as {
    date: string;
    type: "expense" | "income";
    amount: number | string;
    owner_household_member_id: string | null;
  }[];

  const byMonth = new Map<string, Record<string, CashFlowOwnerTotals>>();
  for (const { year, month } of months) {
    byMonth.set(monthKey(year, month), {});
  }

  for (const row of rows) {
    const [yearStr, monthStr] = row.date.split("-");
    const key = monthKey(Number(yearStr), Number(monthStr));
    const totalsByOwner = byMonth.get(key);
    if (!totalsByOwner) continue; // outside requested range

    const ownerKey = row.owner_household_member_id ?? SHARED_KEY;
    const totals = totalsByOwner[ownerKey] ?? { income: 0, expense: 0 };
    if (row.type === "income") {
      totals.income += Number(row.amount);
    } else {
      totals.expense += Number(row.amount);
    }
    totalsByOwner[ownerKey] = totals;
  }

  return months.map(({ year, month }) => ({
    year,
    month,
    totalsByOwner: byMonth.get(monthKey(year, month))!,
  }));
}
