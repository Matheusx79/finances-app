import type { SupabaseClient } from "@supabase/supabase-js";
import type { TransactionType } from "@/domain/transactions/types";
import { RECURRING_TEMPLATE_COLUMNS, toRecurringTemplate } from "./types";

/**
 * A transaction auto-posted by `postDueRecurringTransactions`. Shaped like
 * `Transaction` (see `@/domain/transactions/types`) plus the
 * `recurringTemplateId` back-reference. Kept as a local type here (rather
 * than extending the shared `Transaction`/`TRANSACTION_COLUMNS` — which this
 * ticket's file-ownership boundary excludes from edits) so this module stays
 * self-contained under `src/domain/recurring/`.
 */
export type PostedRecurringTransaction = {
  id: string;
  householdId: string;
  type: TransactionType;
  amount: number;
  date: string;
  categoryId: string | null;
  accountId: string;
  ownerHouseholdMemberId: string | null;
  note: string | null;
  createdAt: string;
  recurringTemplateId: string;
};

const POSTED_TRANSACTION_COLUMNS =
  "id, household_id, type, amount, date, category_id, account_id, owner_household_member_id, note, created_at, recurring_template_id";

type PostedTransactionRow = {
  id: string;
  household_id: string;
  type: TransactionType;
  amount: number | string;
  date: string;
  category_id: string | null;
  account_id: string;
  owner_household_member_id: string | null;
  note: string | null;
  created_at: string;
  recurring_template_id: string;
};

function toPostedRecurringTransaction(row: PostedTransactionRow): PostedRecurringTransaction {
  return {
    id: row.id,
    householdId: row.household_id,
    type: row.type,
    amount: Number(row.amount),
    date: row.date,
    categoryId: row.category_id,
    accountId: row.account_id,
    ownerHouseholdMemberId: row.owner_household_member_id,
    note: row.note,
    createdAt: row.created_at,
    recurringTemplateId: row.recurring_template_id,
  };
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatDate(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, "0")}-${pad2(month)}-${pad2(day)}`;
}

/** Last day of the given calendar month (1-indexed month, matching the rest of this codebase's convention). */
function daysInMonth(year: number, month: number): number {
  // Day 0 of `month` (Date's month arg is 0-indexed, so passing the
  // 1-indexed `month` here lands on next month) rolls back to the last day
  // of the intended month.
  return new Date(year, month, 0).getDate();
}

/**
 * Scans active recurring templates — scoped to `householdId` if given, else
 * every household visible to `supabase` (e.g. the service-role/admin client
 * the cron route uses, since a scheduled job has no single household's
 * session) — and auto-posts a normal `transactions` row for each template
 * whose due date has arrived, referencing the template it came from.
 * Paused templates (`active: false`) are excluded from the scan entirely,
 * so they never auto-post.
 *
 * Due-date rule: a template is due once `today`'s day-of-month reaches its
 * `day_of_month`. Short months are handled by clamping the template's day
 * to that month's last day (e.g. `day_of_month: 31` in a 30-day April
 * becomes due on April 30, rather than never firing in April, or rolling
 * into May) — a bill "due on the 31st" should still post once every month.
 *
 * Idempotency: before posting, checks whether a transaction referencing
 * this template already exists within the current calendar month. This
 * makes the function safe to call repeatedly (e.g. a daily cron run) on or
 * after the due date without double-posting — no separate
 * last-posted-month bookkeeping column is needed (see the migration's
 * comment on `recurring_templates` for why).
 *
 * The posted transaction is dated to the (possibly clamped) due date
 * itself, not to whatever day this function happens to run on — if a run
 * is missed and a later run catches up, the transaction still lands on the
 * date it was nominally due.
 */
export async function postDueRecurringTransactions(
  supabase: SupabaseClient,
  { householdId, today = new Date() }: { householdId?: string; today?: Date } = {},
): Promise<PostedRecurringTransaction[]> {
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const todayDay = today.getDate();
  const monthStart = formatDate(year, month, 1);
  const nextMonthStart =
    month === 12 ? formatDate(year + 1, 1, 1) : formatDate(year, month + 1, 1);

  let templatesQuery = supabase
    .from("recurring_templates")
    .select(RECURRING_TEMPLATE_COLUMNS)
    .eq("active", true);
  if (householdId) {
    templatesQuery = templatesQuery.eq("household_id", householdId);
  }
  const { data: templateRows, error: templatesError } = await templatesQuery;
  if (templatesError) throw templatesError;

  const posted: PostedRecurringTransaction[] = [];

  for (const template of templateRows.map(toRecurringTemplate)) {
    const effectiveDay = Math.min(template.dayOfMonth, daysInMonth(year, month));
    if (todayDay < effectiveDay) continue; // not due yet this month

    const { data: existing, error: existingError } = await supabase
      .from("transactions")
      .select("id")
      .eq("recurring_template_id", template.id)
      .gte("date", monthStart)
      .lt("date", nextMonthStart)
      .limit(1);
    if (existingError) throw existingError;
    if (existing.length > 0) continue; // already posted for this template this month

    const { data: inserted, error: insertError } = await supabase
      .from("transactions")
      .insert({
        household_id: template.householdId,
        type: template.type,
        amount: template.amount,
        date: formatDate(year, month, effectiveDay),
        account_id: template.accountId,
        category_id: template.categoryId,
        owner_household_member_id: template.ownerHouseholdMemberId,
        recurring_template_id: template.id,
      })
      .select(POSTED_TRANSACTION_COLUMNS)
      .single();
    if (insertError) throw insertError;

    posted.push(toPostedRecurringTransaction(inserted));
  }

  return posted;
}
