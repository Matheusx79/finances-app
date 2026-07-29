import { createHash } from "node:crypto";
import type { TransactionType } from "@/domain/transactions/types";

export type ParsedCardBillRow = {
  date: string;
  amount: number;
  type: TransactionType;
  description: string;
  externalId: string;
};

type CardBillPasteRow = {
  data?: unknown;
  descricao?: unknown;
  valor?: unknown;
  parcela?: unknown;
};

const CODE_FENCE_RE = /^```(?:json)?\s*([\s\S]*?)\s*```$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function stripCodeFence(text: string): string {
  const match = text.trim().match(CODE_FENCE_RE);
  return match ? match[1] : text;
}

function externalIdFor(date: string, description: string, amount: number): string {
  return createHash("sha256").update(`${date}|${description}|${amount}`).digest("hex");
}

/**
 * Parses a pasted JSON array (Claude.ai chat's reply to the card-bill prompt
 * template) into staging rows. Pure — no I/O. A row missing a parseable
 * `data`/`valor` is skipped rather than failing the whole paste, since one
 * malformed line in an otherwise-good bill shouldn't block the rest —
 * matching `parseOfxStatement`'s tolerance for individual bad rows.
 */
export function parseCardBillPaste(jsonText: string): ParsedCardBillRow[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(jsonText));
  } catch {
    throw new Error("Não foi possível interpretar o texto colado. Verifique se é um JSON válido.");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Não foi possível interpretar o texto colado. Verifique se é um JSON válido.");
  }

  const rows: ParsedCardBillRow[] = [];

  for (const raw of parsed as CardBillPasteRow[]) {
    const date = typeof raw.data === "string" && DATE_RE.test(raw.data) ? raw.data : null;
    const signedAmount = typeof raw.valor === "number" && Number.isFinite(raw.valor) ? raw.valor : null;
    if (!date || signedAmount === null) continue;

    const parcela = typeof raw.parcela === "string" && raw.parcela.trim() ? raw.parcela.trim() : null;
    const baseDescription = typeof raw.descricao === "string" ? raw.descricao.trim() : "";
    const description = parcela ? `${baseDescription} (${parcela})` : baseDescription;
    const amount = Number(Math.abs(signedAmount).toFixed(2));

    rows.push({
      date,
      amount,
      type: signedAmount < 0 ? "income" : "expense",
      description,
      externalId: externalIdFor(date, description, amount),
    });
  }

  return rows;
}
