export type OfxTransactionType = "expense" | "income";

export type ParsedOfxRow = {
  date: string;
  amount: number;
  type: OfxTransactionType;
  description: string;
  fitid: string | null;
};

// OFX 1.x is SGML, not XML — child tags like <TRNTYPE>DEBIT have no closing
// tag, so each value runs to the next `<` or line break rather than to a
// matching `</TAG>`. `<STMTTRN>` itself is treated as closed (real-world
// bank exports do close it) so blocks can be split out first.
const STMTTRN_BLOCK_RE = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;

const CREDIT_TRNTYPES = new Set(["CREDIT", "DEP", "INT", "DIV"]);
const DEBIT_TRNTYPES = new Set([
  "DEBIT",
  "CHECK",
  "PAYMENT",
  "FEE",
  "SRVCHG",
  "ATM",
  "POS",
  "CASH",
  "DIRECTDEBIT",
  "REPEATPMT",
]);

function extractTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}>([^<\\r\\n]*)`, "i"));
  const value = match?.[1]?.trim();
  return value ? value : null;
}

function formatOfxDate(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.slice(0, 8);
  if (!/^\d{8}$/.test(digits)) return null;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

function resolveType(trnType: string | null, amount: number): OfxTransactionType {
  if (trnType && CREDIT_TRNTYPES.has(trnType)) return "income";
  if (trnType && DEBIT_TRNTYPES.has(trnType)) return "expense";
  return amount < 0 ? "expense" : "income";
}

/**
 * Parses `STMTTRN` blocks out of raw OFX 1.x (SGML) statement text. Pure —
 * no I/O. Rows with `TRNTYPE = XFER` (account-to-account transfers, not real
 * income/expense) are dropped entirely rather than surfaced for review.
 * Rows missing an unambiguous date or amount are skipped rather than
 * fabricating a value; a missing/malformed `FITID` is not fatal (`fitid`
 * comes back `null`, which just means that row can never be deduplicated by
 * `importTransactions`).
 */
export function parseOfxStatement(ofxText: string): ParsedOfxRow[] {
  if (!/<OFX[\s>]/i.test(ofxText)) {
    throw new Error("Arquivo OFX inválido.");
  }

  const rows: ParsedOfxRow[] = [];

  for (const match of ofxText.matchAll(STMTTRN_BLOCK_RE)) {
    const block = match[1];

    const trnType = extractTag(block, "TRNTYPE")?.toUpperCase() ?? null;
    if (trnType === "XFER") continue;

    const rawAmount = extractTag(block, "TRNAMT");
    const signedAmount = rawAmount ? Number(rawAmount) : NaN;
    if (!Number.isFinite(signedAmount)) continue;

    const date = formatOfxDate(extractTag(block, "DTPOSTED"));
    if (!date) continue;

    const description = extractTag(block, "NAME") ?? extractTag(block, "MEMO") ?? "";
    const fitid = extractTag(block, "FITID");

    rows.push({
      date,
      amount: Number(Math.abs(signedAmount).toFixed(2)),
      type: resolveType(trnType, signedAmount),
      description,
      fitid,
    });
  }

  return rows;
}
