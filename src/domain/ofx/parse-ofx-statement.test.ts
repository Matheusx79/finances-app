import { describe, expect, it } from "vitest";
import { parseOfxStatement } from "./parse-ofx-statement";

function ofx(body: string): string {
  return `OFXHEADER:100\nDATA:OFXSGML\nVERSION:102\n\n<OFX>\n<BANKMSGSRSV1>\n<STMTTRNRS>\n<STMTRS>\n<BANKTRANLIST>\n${body}\n</BANKTRANLIST>\n</STMTRS>\n</STMTTRNRS>\n</BANKMSGSRSV1>\n</OFX>\n`;
}

describe("parseOfxStatement", () => {
  it("parses a normal debit row as an expense with a positive amount", () => {
    const rows = parseOfxStatement(
      ofx(`<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260710120000
<TRNAMT>-45.90
<FITID>2026071000123
<NAME>SUPERMERCADO ABC
</STMTTRN>`),
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      date: "2026-07-10",
      amount: 45.9,
      type: "expense",
      description: "SUPERMERCADO ABC",
      fitid: "2026071000123",
    });
  });

  it("parses a normal credit row as income with a positive amount", () => {
    const rows = parseOfxStatement(
      ofx(`<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260705120000
<TRNAMT>5000.00
<FITID>2026070500456
<NAME>SALARIO
</STMTTRN>`),
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe("income");
    expect(rows[0].amount).toBe(5000);
  });

  it("drops XFER rows entirely", () => {
    const rows = parseOfxStatement(
      ofx(`<STMTTRN>
<TRNTYPE>XFER
<DTPOSTED>20260706120000
<TRNAMT>-100.00
<FITID>2026070600789
<NAME>TRANSFERENCIA ENTRE CONTAS
</STMTTRN>`),
    );

    expect(rows).toHaveLength(0);
  });

  it("parses multiple STMTTRN blocks in one statement", () => {
    const rows = parseOfxStatement(
      ofx(`<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260701120000
<TRNAMT>-10.00
<FITID>fit-1
<NAME>A
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260702120000
<TRNAMT>20.00
<FITID>fit-2
<NAME>B
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260703120000
<TRNAMT>-30.00
<FITID>fit-3
<NAME>C
</STMTTRN>`),
    );

    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.fitid)).toEqual(["fit-1", "fit-2", "fit-3"]);
  });

  it("handles a missing FITID by returning fitid: null instead of throwing", () => {
    const rows = parseOfxStatement(
      ofx(`<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260710120000
<TRNAMT>-15.00
<NAME>SEM FITID
</STMTTRN>`),
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].fitid).toBeNull();
  });

  it("handles a malformed (empty) FITID tag by returning fitid: null", () => {
    const rows = parseOfxStatement(
      ofx(`<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260710120000
<TRNAMT>-15.00
<FITID>
<NAME>FITID VAZIO
</STMTTRN>`),
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].fitid).toBeNull();
  });

  it("falls back to TRNAMT sign when TRNTYPE is absent or unrecognized", () => {
    const rows = parseOfxStatement(
      ofx(`<STMTTRN>
<DTPOSTED>20260710120000
<TRNAMT>-8.50
<FITID>fit-neg
<NAME>SEM TRNTYPE NEGATIVO
</STMTTRN>
<STMTTRN>
<TRNTYPE>OTHER
<DTPOSTED>20260711120000
<TRNAMT>8.50
<FITID>fit-pos
<NAME>TRNTYPE DESCONHECIDO POSITIVO
</STMTTRN>`),
    );

    expect(rows).toHaveLength(2);
    expect(rows[0].type).toBe("expense");
    expect(rows[0].amount).toBe(8.5);
    expect(rows[1].type).toBe("income");
    expect(rows[1].amount).toBe(8.5);
  });

  it("throws on unparseable/invalid OFX content", () => {
    expect(() => parseOfxStatement("this is not an ofx file at all")).toThrow();
  });
});
