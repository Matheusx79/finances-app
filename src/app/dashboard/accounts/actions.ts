"use server";

import { revalidatePath } from "next/cache";
import { requireHousehold, requireUser } from "@/lib/current-household";
import { createAccount } from "@/domain/accounts/create-account";
import { renameAccount } from "@/domain/accounts/rename-account";
import { deleteAccount } from "@/domain/accounts/delete-account";

export async function createAccountAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { supabase, householdId } = await requireHousehold();
  await createAccount(supabase, { householdId, name });

  revalidatePath("/dashboard/accounts");
}

export async function renameAccountAction(formData: FormData) {
  const accountId = String(formData.get("accountId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!accountId || !name) return;

  // Household scoping is enforced by RLS — no household lookup needed here.
  const { supabase } = await requireUser();
  await renameAccount(supabase, { accountId, name });

  revalidatePath("/dashboard/accounts");
}

export async function deleteAccountAction(formData: FormData) {
  const accountId = String(formData.get("accountId") ?? "");
  if (!accountId) return;

  // Household scoping is enforced by RLS — no household lookup needed here.
  const { supabase } = await requireUser();
  await deleteAccount(supabase, { accountId });

  revalidatePath("/dashboard/accounts");
}
