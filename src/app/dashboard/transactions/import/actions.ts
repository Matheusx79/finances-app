"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHousehold } from "@/lib/current-household";
import { listAccounts } from "@/domain/accounts/list-accounts";
import { listCategories } from "@/domain/categories/list-categories";
import { parseOfxStatement } from "@/domain/ofx/parse-ofx-statement";
import { parseCardBillPaste } from "@/domain/card-bill/parse-card-bill-paste";
import {
  findExistingExternalIds,
  findManualDuplicateCandidates,
  importTransactions,
  type ImportOfxRow,
} from "@/domain/transactions/import-transactions";
import {
  classifyDuplicateKinds,
  dateWindowForBatch,
  type DuplicateKind,
  type ImportRowForDuplicateMatching,
} from "@/domain/transactions/find-likely-duplicate-manual-transactions";
import type { Account } from "@/domain/accounts/types";
import type { HouseholdMember } from "@/domain/household/types";
import type { TransactionType } from "@/domain/transactions/types";
import { encodeOfxBatch, type OfxBatchRow } from "./batch-codec";

function importUrl(params: Record<string, string>): string {
  return `/dashboard/transactions/import?${new URLSearchParams(params).toString()}`;
}

// Unlike the manual transaction form (which trusts RLS/the household
// consistency trigger alone on accountId/owner), the OFX flow pre-validates
// account/owner up front so a stale or tampered request redirects with a
// friendly pt-BR error instead of surfacing the trigger's raw exception —
// worthwhile here since both actions accept these ids from client-echoed
// form state (a select value, then a hidden field) rather than a value the
// user picks fresh each submit.
function accountAndOwnerAreValid({
  accountId,
  ownerId,
  accounts,
  members,
}: {
  accountId: string;
  ownerId: string;
  accounts: Account[];
  members: HouseholdMember[];
}): boolean {
  return accounts.some((account) => account.id === accountId) && members.some((member) => member.id === ownerId);
}

/**
 * Fetches the fuzzy-match candidate pool (ADR-0005) and delegates the actual
 * per-row classification to `classifyDuplicateKinds` — kept this thin so the
 * only thing living here is the DB round-trip; the classification logic
 * itself is a pure, directly-tested domain function.
 */
async function computeDuplicateKinds(
  supabase: SupabaseClient,
  {
    accountId,
    rows,
    isExactDuplicate,
  }: {
    accountId: string;
    rows: ImportRowForDuplicateMatching[];
    isExactDuplicate: boolean[];
  },
): Promise<DuplicateKind[]> {
  const fuzzyCandidateDates = rows.filter((_, i) => !isExactDuplicate[i]).map((row) => row.date);
  const window = dateWindowForBatch(fuzzyCandidateDates);
  const manualCandidates = window
    ? await findManualDuplicateCandidates(supabase, { accountId, ...window })
    : [];

  return classifyDuplicateKinds(rows, isExactDuplicate, manualCandidates);
}

export async function uploadOfxAction(formData: FormData) {
  const file = formData.get("file");
  const accountId = String(formData.get("accountId") ?? "");
  const ownerId = String(formData.get("ownerId") ?? "");

  if (!(file instanceof File) || file.size === 0 || !accountId || !ownerId) {
    redirect(importUrl({ erro: "campos-obrigatorios" }));
  }

  const { supabase, householdId, household } = await requireHousehold();

  const accounts = await listAccounts(supabase, { householdId });
  if (!accountAndOwnerAreValid({ accountId, ownerId, accounts, members: household.members })) {
    redirect(importUrl({ erro: "conta-ou-responsavel-invalido" }));
  }

  const ofxText = await file.text();

  let parsedRows;
  try {
    parsedRows = parseOfxStatement(ofxText);
  } catch {
    redirect(importUrl({ erro: "ofx-invalido" }));
  }

  const fitids = parsedRows
    .map((row) => row.fitid)
    .filter((fitid): fitid is string => fitid !== null);
  const existingFitids = await findExistingExternalIds(supabase, { accountId, fitids });
  const isExactDuplicate = parsedRows.map((row) => Boolean(row.fitid && existingFitids.has(row.fitid)));
  const duplicateKinds = await computeDuplicateKinds(supabase, {
    accountId,
    rows: parsedRows,
    isExactDuplicate,
  });

  const batchRows: OfxBatchRow[] = parsedRows.map((row, i) => ({
    ...row,
    duplicateKind: duplicateKinds[i],
  }));

  redirect(
    importUrl({
      batch: encodeOfxBatch(batchRows),
      accountId,
      ownerId,
    }),
  );
}

export async function pasteCardBillAction(formData: FormData) {
  const pasteText = String(formData.get("paste") ?? "");
  const accountId = String(formData.get("accountId") ?? "");
  const ownerId = String(formData.get("ownerId") ?? "");

  if (!pasteText.trim() || !accountId || !ownerId) {
    redirect(importUrl({ tab: "fatura", erro: "campos-obrigatorios" }));
  }

  const { supabase, householdId, household } = await requireHousehold();

  const accounts = await listAccounts(supabase, { householdId });
  if (!accountAndOwnerAreValid({ accountId, ownerId, accounts, members: household.members })) {
    redirect(importUrl({ tab: "fatura", erro: "conta-ou-responsavel-invalido" }));
  }

  const categories = await listCategories(supabase, { householdId });

  let parsedRows;
  try {
    parsedRows = parseCardBillPaste(pasteText, categories);
  } catch {
    redirect(importUrl({ tab: "fatura", erro: "fatura-invalida" }));
  }

  const externalIds = parsedRows.map((row) => row.externalId);
  const existingExternalIds = await findExistingExternalIds(supabase, { accountId, fitids: externalIds });
  const isExactDuplicate = parsedRows.map((row) => existingExternalIds.has(row.externalId));
  const duplicateKinds = await computeDuplicateKinds(supabase, {
    accountId,
    rows: parsedRows,
    isExactDuplicate,
  });

  const batchRows: OfxBatchRow[] = parsedRows.map((row, i) => ({
    date: row.date,
    amount: row.amount,
    type: row.type,
    description: row.description,
    fitid: row.externalId,
    duplicateKind: duplicateKinds[i],
    suggestedCategoryId: row.suggestedCategoryId,
  }));

  redirect(
    importUrl({
      batch: encodeOfxBatch(batchRows),
      accountId,
      ownerId,
    }),
  );
}

export async function confirmOfxImportAction(formData: FormData) {
  const accountId = String(formData.get("accountId") ?? "");
  const ownerId = String(formData.get("ownerId") ?? "");
  const rowCount = Number(formData.get("rowCount") ?? "0");

  const rows: ImportOfxRow[] = [];
  for (let i = 0; i < rowCount; i++) {
    if (!formData.get(`include-${i}`)) continue;
    rows.push({
      date: String(formData.get(`date-${i}`) ?? ""),
      amount: Number(formData.get(`amount-${i}`)),
      type: String(formData.get(`type-${i}`) ?? "") as TransactionType,
      categoryId: String(formData.get(`categoryId-${i}`) ?? "") || null,
      fitid: String(formData.get(`fitid-${i}`) ?? "") || null,
      description: String(formData.get(`description-${i}`) ?? ""),
    });
  }

  if (rows.length === 0) {
    redirect("/dashboard/transactions");
  }

  // Same rule as manual entry (see transactions/actions.ts), checked here
  // before calling importTransactions so the whole confirm redirects with a
  // pt-BR error instead of surfacing the table's raw check-constraint error.
  if (rows.some((row) => row.type === "expense" && !row.categoryId)) {
    redirect("/dashboard/transactions?erro=categoria-obrigatoria");
  }

  const { supabase, householdId, household } = await requireHousehold();
  const accounts = await listAccounts(supabase, { householdId });
  if (!accountAndOwnerAreValid({ accountId, ownerId, accounts, members: household.members })) {
    redirect(importUrl({ erro: "conta-ou-responsavel-invalido" }));
  }

  await importTransactions(supabase, {
    householdId,
    accountId,
    ownerHouseholdMemberId: ownerId,
    rows,
  });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
  redirect("/dashboard/transactions");
}
