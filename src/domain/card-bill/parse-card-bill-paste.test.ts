import { describe, expect, it } from "vitest";
import { parseCardBillPaste } from "./parse-card-bill-paste";

describe("parseCardBillPaste", () => {
  it("parses a normal expense row (positive valor)", () => {
    const rows = parseCardBillPaste(
      JSON.stringify([{ data: "2026-07-10", descricao: "SUPERMERCADO ABC", valor: 45.9, parcela: null }]),
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
    );

    expect(rows[0].description).toBe("Compra X (3/12)");
  });

  it("leaves description unchanged when parcela is null", () => {
    const rows = parseCardBillPaste(
      JSON.stringify([{ data: "2026-07-10", descricao: "Compra Y", valor: 100, parcela: null }]),
    );

    expect(rows[0].description).toBe("Compra Y");
  });

  it("treats a negative valor as income (estorno) with a positive amount", () => {
    const rows = parseCardBillPaste(
      JSON.stringify([{ data: "2026-07-11", descricao: "ESTORNO LOJA X", valor: -30, parcela: null }]),
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
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe("OK");
  });

  it("strips a wrapping ```json code fence before parsing", () => {
    const pasted = "```json\n" + JSON.stringify([{ data: "2026-07-13", descricao: "A", valor: 5, parcela: null }]) + "\n```";
    const rows = parseCardBillPaste(pasted);

    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe("A");
  });

  it("strips a wrapping bare ``` code fence before parsing", () => {
    const pasted = "```\n" + JSON.stringify([{ data: "2026-07-13", descricao: "B", valor: 5, parcela: null }]) + "\n```";
    const rows = parseCardBillPaste(pasted);

    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe("B");
  });

  it("throws a friendly error on invalid (non-JSON) input", () => {
    expect(() => parseCardBillPaste("isso não é JSON")).toThrow(
      "Não foi possível interpretar o texto colado. Verifique se é um JSON válido.",
    );
  });

  it("throws a friendly error when the JSON isn't an array", () => {
    expect(() => parseCardBillPaste(JSON.stringify({ data: "2026-07-10" }))).toThrow(
      "Não foi possível interpretar o texto colado. Verifique se é um JSON válido.",
    );
  });

  it("produces the same externalId for the same date+description+amount", () => {
    const rowsA = parseCardBillPaste(
      JSON.stringify([{ data: "2026-07-10", descricao: "A", valor: 10, parcela: null }]),
    );
    const rowsB = parseCardBillPaste(
      JSON.stringify([{ data: "2026-07-10", descricao: "A", valor: 10, parcela: null }]),
    );

    expect(rowsA[0].externalId).toBe(rowsB[0].externalId);
  });
});
