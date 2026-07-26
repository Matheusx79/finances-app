"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireHousehold, requireUser } from "@/lib/current-household";
import { createTransaction } from "@/domain/transactions/create-transaction";
import { updateTransaction } from "@/domain/transactions/update-transaction";
import { deleteTransaction } from "@/domain/transactions/delete-transaction";
import type { TransactionType } from "@/domain/transactions/types";

function parseTransactionFields(formData: FormData) {
  const type = String(formData.get("type") ?? "") as TransactionType;
  const amount = Number(formData.get("amount"));
  const date = String(formData.get("date") ?? "");
  const accountId = String(formData.get("accountId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const ownerHouseholdMemberId = String(formData.get("owner") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  return { type, amount, date, accountId, categoryId, ownerHouseholdMemberId, note };
}

// Category is required for expenses (per spec/ticket); the form always shows
// the category field (no client JS to hide it conditionally for income), so
// that rule is enforced here before it would otherwise fail the database's
// check constraint, redirecting back with a pt-BR error message — same
// redirect-with-`erro`-query-param pattern as the login form.
function isMissingRequiredCategory(type: TransactionType, categoryId: string | null): boolean {
  return type === "expense" && !categoryId;
}

export async function createTransactionAction(formData: FormData) {
  const { type, amount, date, accountId, categoryId, ownerHouseholdMemberId, note } =
    parseTransactionFields(formData);
  if (!date || !accountId || !amount || amount <= 0) return;
  if (isMissingRequiredCategory(type, categoryId)) {
    redirect("/dashboard/transactions?erro=categoria-obrigatoria");
  }

  const { supabase, householdId } = await requireHousehold();
  await createTransaction(supabase, {
    householdId,
    type,
    amount,
    date,
    accountId,
    categoryId,
    ownerHouseholdMemberId,
    note,
  });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
}

export async function updateTransactionAction(formData: FormData) {
  const transactionId = String(formData.get("transactionId") ?? "");
  const { type, amount, date, accountId, categoryId, ownerHouseholdMemberId, note } =
    parseTransactionFields(formData);
  if (!transactionId || !date || !accountId || !amount || amount <= 0) return;
  if (isMissingRequiredCategory(type, categoryId)) {
    redirect("/dashboard/transactions?erro=categoria-obrigatoria");
  }

  // Household scoping is enforced by RLS — no household lookup needed here.
  // Either household member can edit a transaction regardless of who logged
  // it — there is no owner/creator check beyond household membership.
  const { supabase } = await requireUser();
  await updateTransaction(supabase, {
    transactionId,
    type,
    amount,
    date,
    accountId,
    categoryId,
    ownerHouseholdMemberId,
    note,
  });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
}

export async function deleteTransactionAction(formData: FormData) {
  const transactionId = String(formData.get("transactionId") ?? "");
  if (!transactionId) return;

  // Household scoping is enforced by RLS — no household lookup needed here.
  const { supabase } = await requireUser();
  await deleteTransaction(supabase, { transactionId });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
}
