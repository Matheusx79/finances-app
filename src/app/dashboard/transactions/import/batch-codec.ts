import type { OfxTransactionType } from "@/domain/ofx/parse-ofx-statement";

export type OfxBatchRow = {
  date: string;
  amount: number;
  type: OfxTransactionType;
  description: string;
  fitid: string | null;
  duplicate: boolean;
  suggestedCategoryId?: string | null;
};

/**
 * Carries the parsed+duplicate-flagged rows from the upload step to the
 * review step across a redirect (POST-redirect-GET), base64url-encoded in
 * the `batch` query param — there's no server-side session/staging table to
 * hold them between requests, and the review page is plain server-rendered
 * HTML with no client state to hold them in either. Trade-off: this rides
 * on the URL, so an extremely large statement (many hundreds of rows) could
 * approach common URL-length ceilings (~8KB) — acceptable for this app's
 * couple-scale personal statements, but not a design that scales to bulk
 * bank exports.
 */
export function encodeOfxBatch(rows: OfxBatchRow[]): string {
  return Buffer.from(JSON.stringify(rows), "utf8").toString("base64url");
}

export function decodeOfxBatch(encoded: string): OfxBatchRow[] {
  const parsed: unknown = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  if (!Array.isArray(parsed)) throw new Error("invalid OFX batch");
  return parsed as OfxBatchRow[];
}
