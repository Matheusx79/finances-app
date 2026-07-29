"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireHousehold, requireUser } from "@/lib/current-household";
import { createGoal } from "@/domain/goals/create-goal";
import { updateGoal } from "@/domain/goals/update-goal";
import { deleteGoal } from "@/domain/goals/delete-goal";

// Postgres unique_violation code — raised by the goals.account_id UNIQUE
// constraint when a second Meta targets an already-tied Conta.
const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === UNIQUE_VIOLATION;
}

function readGoalForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const accountId = String(formData.get("accountId") ?? "");
  const targetAmount = Number(formData.get("targetAmount"));
  const targetDate = String(formData.get("targetDate") ?? "").trim();
  return { name, accountId, targetAmount, targetDate: targetDate || null };
}

export async function createGoalAction(formData: FormData) {
  const { name, accountId, targetAmount, targetDate } = readGoalForm(formData);
  if (!name || !accountId || !Number.isFinite(targetAmount) || targetAmount <= 0) return;

  const { supabase, householdId } = await requireHousehold();
  try {
    await createGoal(supabase, { householdId, name, accountId, targetAmount, targetDate });
  } catch (error) {
    if (isUniqueViolation(error)) {
      redirect("/dashboard/goals?erro=conta-ja-vinculada");
    }
    throw error;
  }

  revalidatePath("/dashboard/goals");
}

export async function updateGoalAction(formData: FormData) {
  const goalId = String(formData.get("goalId") ?? "");
  const { name, accountId, targetAmount, targetDate } = readGoalForm(formData);
  if (!goalId || !name || !accountId || !Number.isFinite(targetAmount) || targetAmount <= 0) return;

  const { supabase } = await requireUser();
  try {
    await updateGoal(supabase, { goalId, name, accountId, targetAmount, targetDate });
  } catch (error) {
    if (isUniqueViolation(error)) {
      redirect("/dashboard/goals?erro=conta-ja-vinculada");
    }
    throw error;
  }

  revalidatePath("/dashboard/goals");
}

export async function deleteGoalAction(formData: FormData) {
  const goalId = String(formData.get("goalId") ?? "");
  if (!goalId) return;

  const { supabase } = await requireUser();
  await deleteGoal(supabase, { goalId });

  revalidatePath("/dashboard/goals");
}
