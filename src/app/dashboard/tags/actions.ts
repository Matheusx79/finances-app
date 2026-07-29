"use server";

import { revalidatePath } from "next/cache";
import { requireHousehold, requireUser } from "@/lib/current-household";
import { createTag } from "@/domain/tags/create-tag";
import { renameTag } from "@/domain/tags/rename-tag";
import { deleteTag } from "@/domain/tags/delete-tag";

export async function createTagAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { supabase, householdId } = await requireHousehold();
  await createTag(supabase, { householdId, name });

  revalidatePath("/dashboard/tags");
}

export async function renameTagAction(formData: FormData) {
  const tagId = String(formData.get("tagId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!tagId || !name) return;

  // Household scoping is enforced by RLS — no household lookup needed here.
  const { supabase } = await requireUser();
  await renameTag(supabase, { tagId, name });

  revalidatePath("/dashboard/tags");
}

export async function deleteTagAction(formData: FormData) {
  const tagId = String(formData.get("tagId") ?? "");
  if (!tagId) return;

  // Household scoping is enforced by RLS — no household lookup needed here.
  const { supabase } = await requireUser();
  await deleteTag(supabase, { tagId });

  revalidatePath("/dashboard/tags");
}
