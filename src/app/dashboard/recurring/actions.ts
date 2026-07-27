"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireHousehold, requireUser } from "@/lib/current-household";
import { createRecurringTemplate } from "@/domain/recurring/create-recurring-template";
import { updateRecurringTemplate } from "@/domain/recurring/update-recurring-template";
import { pauseRecurringTemplate } from "@/domain/recurring/pause-recurring-template";
import { resumeRecurringTemplate } from "@/domain/recurring/resume-recurring-template";
import { deleteRecurringTemplate } from "@/domain/recurring/delete-recurring-template";
import type { TransactionType } from "@/domain/transactions/types";

function parseTemplateFields(formData: FormData) {
  const type = String(formData.get("type") ?? "") as TransactionType;
  const amount = Number(formData.get("amount"));
  const dayOfMonth = Number(formData.get("dayOfMonth"));
  const accountId = String(formData.get("accountId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const ownerHouseholdMemberId = String(formData.get("owner") ?? "") || null;

  return { type, amount, dayOfMonth, accountId, categoryId, ownerHouseholdMemberId };
}

// Same rationale as the transaction form's equivalent check: the form always
// shows the category field (no client JS to hide it conditionally for
// income), so this is enforced here before it would otherwise fail the
// database's check constraint.
function isMissingRequiredCategory(type: TransactionType, categoryId: string | null): boolean {
  return type === "expense" && !categoryId;
}

export async function createRecurringTemplateAction(formData: FormData) {
  const { type, amount, dayOfMonth, accountId, categoryId, ownerHouseholdMemberId } =
    parseTemplateFields(formData);
  if (!accountId || !amount || amount <= 0 || !Number.isInteger(dayOfMonth)) return;
  if (dayOfMonth < 1 || dayOfMonth > 31) return;
  if (isMissingRequiredCategory(type, categoryId)) {
    redirect("/dashboard/recurring?erro=categoria-obrigatoria");
  }

  const { supabase, householdId } = await requireHousehold();
  await createRecurringTemplate(supabase, {
    householdId,
    type,
    amount,
    dayOfMonth,
    accountId,
    categoryId,
    ownerHouseholdMemberId,
  });

  revalidatePath("/dashboard/recurring");
}

export async function updateRecurringTemplateAction(formData: FormData) {
  const templateId = String(formData.get("templateId") ?? "");
  const { type, amount, dayOfMonth, accountId, categoryId, ownerHouseholdMemberId } =
    parseTemplateFields(formData);
  if (!templateId || !accountId || !amount || amount <= 0 || !Number.isInteger(dayOfMonth)) return;
  if (dayOfMonth < 1 || dayOfMonth > 31) return;
  if (isMissingRequiredCategory(type, categoryId)) {
    redirect("/dashboard/recurring?erro=categoria-obrigatoria");
  }

  // Household scoping is enforced by RLS — no household lookup needed here.
  const { supabase } = await requireUser();
  await updateRecurringTemplate(supabase, {
    templateId,
    type,
    amount,
    dayOfMonth,
    accountId,
    categoryId,
    ownerHouseholdMemberId,
  });

  revalidatePath("/dashboard/recurring");
}

export async function pauseRecurringTemplateAction(formData: FormData) {
  const templateId = String(formData.get("templateId") ?? "");
  if (!templateId) return;

  const { supabase } = await requireUser();
  await pauseRecurringTemplate(supabase, { templateId });

  revalidatePath("/dashboard/recurring");
}

export async function resumeRecurringTemplateAction(formData: FormData) {
  const templateId = String(formData.get("templateId") ?? "");
  if (!templateId) return;

  const { supabase } = await requireUser();
  await resumeRecurringTemplate(supabase, { templateId });

  revalidatePath("/dashboard/recurring");
}

export async function deleteRecurringTemplateAction(formData: FormData) {
  const templateId = String(formData.get("templateId") ?? "");
  if (!templateId) return;

  const { supabase } = await requireUser();
  await deleteRecurringTemplate(supabase, { templateId });

  revalidatePath("/dashboard/recurring");
}
