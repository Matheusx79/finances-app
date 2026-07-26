"use server";

import { revalidatePath } from "next/cache";
import { requireHousehold, requireUser } from "@/lib/current-household";
import { createCategory } from "@/domain/categories/create-category";
import { renameCategory } from "@/domain/categories/rename-category";
import { deleteCategory } from "@/domain/categories/delete-category";

export async function createCategoryAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { supabase, householdId } = await requireHousehold();
  await createCategory(supabase, { householdId, name });

  revalidatePath("/dashboard/categories");
}

export async function renameCategoryAction(formData: FormData) {
  const categoryId = String(formData.get("categoryId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!categoryId || !name) return;

  // Household scoping is enforced by RLS — no household lookup needed here.
  const { supabase } = await requireUser();
  await renameCategory(supabase, { categoryId, name });

  revalidatePath("/dashboard/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) return;

  // Household scoping is enforced by RLS — no household lookup needed here.
  const { supabase } = await requireUser();
  await deleteCategory(supabase, { categoryId });

  revalidatePath("/dashboard/categories");
}
