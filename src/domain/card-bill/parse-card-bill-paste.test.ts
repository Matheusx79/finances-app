import { describe, expect, it } from "vitest";
import { parseCardBillPaste } from "./parse-card-bill-paste";
import type { Category } from "@/domain/categories/types";

const NO_CATEGORIES: Category[] = [];
const CATEGORIES: Category[] = [
  { id: "cat-mercado", householdId: "h1", name: "Mercado", createdAt: "2026-01-01" },
  { id: "cat-delivery", householdId: "h1", name: "Delivery", createdAt: "2026-01-01" },
];

describe("parseCardBillPaste", () => {
  it("parses a normal expense row (positive valor)", () => {
    const rows = parseCardBillPaste(
      JSON.stringify([{ data: "2026-07-10", descricao: "SUPERMERCADO ABC", valor: 45.9, parcela: null }]),
      NO_CATEGORIES,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].date).toBe("2026-07-10");
    expect(rows[0].amount).toBe(45.9);
    expect(rows[0].type).toBe("expense");
    expect(rows[0].description).toBe("SUPERMERCADO ABC");
    expect(rows[0].externalId).toEqual(expect.any(String));
  });

  it("appends parcela into the description when present", () => {
    const rows = parseCardBillPaste(
      JSON.stringify([{ data: "2026-07-10", descricao: "Compra X", valor: 100, parcela: "3/12" }]),
      NO_CATEGORIES,
    );

    expect(rows[0].description).toBe("Compra X (3/12)");
  });

  it("leaves description unchanged when parcela is null", () => {
    const rows = parseCardBillPaste(
      JSON.stringify([{ data: "2026-07-10", descricao: "Compra Y", valor: 100, parcela: null }]),
      NO_CATEGORIES,
    );

    expect(rows[0].description).toBe("Compra Y");
  });

  it("treats a negative valor as income (estorno) with a positive amount", () => {
    const rows = parseCardBillPaste(
      JSON.stringify([{ data: "2026-07-11", descricao: "ESTORNO LOJA X", valor: -30, parcela: null }]),
      NO_CATEGORIES,
    );

    expect(rows[0].type).toBe("income");
    expect(rows[0].amount).toBe(30);
  });

  it("skips a row missing a parseable data, without failing the whole paste", () => {
    const rows = parseCardBillPaste(
      JSON.stringify([
        { data: null, descricao: "SEM DATA", valor: 10, parcela: null },
        { data: "2026-07-12", descricao: "OK", valor: 20, parcela: null },
      ]),
      NO_CATEGORIES,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe("OK");
  });

  it("skips a row missing a parseable valor, without failing the whole paste", () => {
    const rows = parseCardBillPaste(
      JSON.stringify([
        { data: "2026-07-12", descricao: "SEM VALOR", valor: "abc", parcela: null },
        { data: "2026-07-12", descricao: "OK", valor: 20, parcela: null },
      ]),
      NO_CATEGORIES,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe("OK");
  });

  it("strips a wrapping ```json code fence before parsing", () => {
    const pasted =
      "```json\n" +
      JSON.stringify([{ data: "2026-07-13", descricao: "A", valor: 5, parcela: null }]) +
      "\n```";
    const rows = parseCardBillPaste(pasted, NO_CATEGORIES);

    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe("A");
  });

  it("strips a wrapping bare ``` code fence before parsing", () => {
    const pasted =
      "```\n" + JSON.stringify([{ data: "2026-07-13", descricao: "B", valor: 5, parcela: null }]) + "\n```";
    const rows = parseCardBillPaste(pasted, NO_CATEGORIES);

    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe("B");
  });

  it("throws a friendly error on invalid (non-JSON) input", () => {
    expect(() => parseCardBillPaste("isso não é JSON", NO_CATEGORIES)).toThrow(
      "Não foi possível interpretar o texto colado. Verifique se é um JSON válido.",
    );
  });

  it("throws a friendly error when the JSON isn't an array", () => {
    expect(() => parseCardBillPaste(JSON.stringify({ data: "2026-07-10" }), NO_CATEGORIES)).toThrow(
      "Não foi possível interpretar o texto colado. Verifique se é um JSON válido.",
    );
  });

  it("produces the same externalId for the same date+description+amount", () => {
    const rowsA = parseCardBillPaste(
      JSON.stringify([{ data: "2026-07-10", descricao: "A", valor: 10, parcela: null }]),
      NO_CATEGORIES,
    );
    const rowsB = parseCardBillPaste(
      JSON.stringify([{ data: "2026-07-10", descricao: "A", valor: 10, parcela: null }]),
      NO_CATEGORIES,
    );

    expect(rowsA[0].externalId).toBe(rowsB[0].externalId);
  });

  it("resolves a categoria name to the matching category id", () => {
    const rows = parseCardBillPaste(
      JSON.stringify([{ data: "2026-07-10", descricao: "Ifood", valor: 45, parcela: null, categoria: "Delivery" }]),
      CATEGORIES,
    );

    expect(rows[0].suggestedCategoryId).toBe("cat-delivery");
  });

  it("resolves categoria case-insensitively", () => {
    const rows = parseCardBillPaste(
      JSON.stringify([{ data: "2026-07-10", descricao: "X", valor: 45, parcela: null, categoria: "delivery" }]),
      CATEGORIES,
    );

    expect(rows[0].suggestedCategoryId).toBe("cat-delivery");
  });

  it("leaves suggestedCategoryId null when categoria is null", () => {
    const rows = parseCardBillPaste(
      JSON.stringify([{ data: "2026-07-10", descricao: "X", valor: 45, parcela: null, categoria: null }]),
      CATEGORIES,
    );

    expect(rows[0].suggestedCategoryId).toBeNull();
  });

  it("leaves suggestedCategoryId null when categoria doesn't match any real category", () => {
    const rows = parseCardBillPaste(
      JSON.stringify([{ data: "2026-07-10", descricao: "X", valor: 45, parcela: null, categoria: "Inventada" }]),
      CATEGORIES,
    );

    expect(rows[0].suggestedCategoryId).toBeNull();
  });
});
