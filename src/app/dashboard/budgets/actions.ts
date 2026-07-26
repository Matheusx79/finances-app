"use server";

import { revalidatePath } from "next/cache";
import { requireHousehold } from "@/lib/current-household";
import { setCategoryBudget } from "@/domain/budgets/set-category-budget";

export async function setCategoryBudgetAction(formData: FormData) {
  const categoryId = String(formData.get("categoryId") ?? "");
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  const amount = Number(formData.get("amount"));
  if (!categoryId || !Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(amount)) {
    return;
  }

  const { supabase, householdId } = await requireHousehold();
  await setCategoryBudget(supabase, { householdId, categoryId, year, month, amount });

  revalidatePath("/dashboard/budgets");
  revalidatePath("/dashboard");
}
