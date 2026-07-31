import { describe, expect, it } from "vitest";
import {
  classifyDuplicateKinds,
  dateWindowForBatch,
  findLikelyDuplicateManualTransactions,
} from "./find-likely-duplicate-manual-transactions";

describe("findLikelyDuplicateManualTransactions", () => {
  it("matches a manual entry with the same amount/type within 5 days", () => {
    const rows = [{ date: "2026-07-10", amount: 45.9, type: "expense" as const }];
    const candidates = [{ id: "manual-1", date: "2026-07-08", amount: 45.9, type: "expense" as const }];

    expect(findLikelyDuplicateManualTransactions(rows, candidates)).toEqual(["manual-1"]);
  });

  it("does not match beyond the 5-day window", () => {
    const rows = [{ date: "2026-07-10", amount: 45.9, type: "expense" as const }];
    const candidates = [{ id: "manual-1", date: "2026-07-03", amount: 45.9, type: "expense" as const }];

    expect(findLikelyDuplicateManualTransactions(rows, candidates)).toEqual([null]);
  });

  it("does not match a different amount", () => {
    const rows = [{ date: "2026-07-10", amount: 45.9, type: "expense" as const }];
    const candidates = [{ id: "manual-1", date: "2026-07-10", amount: 45.91, type: "expense" as const }];

    expect(findLikelyDuplicateManualTransactions(rows, candidates)).toEqual([null]);
  });

  it("does not match a different type even with the same amount/date", () => {
    const rows = [{ date: "2026-07-10", amount: 45.9, type: "expense" as const }];
    const candidates = [{ id: "manual-1", date: "2026-07-10", amount: 45.9, type: "income" as const }];

    expect(findLikelyDuplicateManualTransactions(rows, candidates)).toEqual([null]);
  });

  it("picks the closest-dated candidate when more than one matches", () => {
    const rows = [{ date: "2026-07-10", amount: 45.9, type: "expense" as const }];
    const candidates = [
      { id: "manual-far", date: "2026-07-06", amount: 45.9, type: "expense" as const },
      { id: "manual-close", date: "2026-07-09", amount: 45.9, type: "expense" as const },
    ];

    expect(findLikelyDuplicateManualTransactions(rows, candidates)).toEqual(["manual-close"]);
  });

  it("matches each row independently against the full candidate list", () => {
    const rows = [
      { date: "2026-07-10", amount: 45.9, type: "expense" as const },
      { date: "2026-07-11", amount: 12, type: "expense" as const },
    ];
    const candidates = [
      { id: "manual-1", date: "2026-07-10", amount: 45.9, type: "expense" as const },
      { id: "manual-2", date: "2026-07-11", amount: 12, type: "expense" as const },
    ];

    expect(findLikelyDuplicateManualTransactions(rows, candidates)).toEqual(["manual-1", "manual-2"]);
  });

  it("returns null for every row when there are no candidates", () => {
    const rows = [{ date: "2026-07-10", amount: 45.9, type: "expense" as const }];

    expect(findLikelyDuplicateManualTransactions(rows, [])).toEqual([null]);
  });
});

describe("classifyDuplicateKinds", () => {
  it("marks exact-duplicate rows without spending a fuzzy lookup on them", () => {
    const rows = [{ date: "2026-07-10", amount: 45.9, type: "expense" as const }];

    expect(classifyDuplicateKinds(rows, [true], [])).toEqual(["exact"]);
  });

  it("marks a fuzzy match for a non-exact row", () => {
    const rows = [{ date: "2026-07-10", amount: 45.9, type: "expense" as const }];
    const candidates = [{ id: "manual-1", date: "2026-07-09", amount: 45.9, type: "expense" as const }];

    expect(classifyDuplicateKinds(rows, [false], candidates)).toEqual(["fuzzy"]);
  });

  it("marks null when a non-exact row has no fuzzy match either", () => {
    const rows = [{ date: "2026-07-10", amount: 45.9, type: "expense" as const }];

    expect(classifyDuplicateKinds(rows, [false], [])).toEqual([null]);
  });

  // Regression test for the index-realignment step: the fuzzy pass only
  // sees non-exact rows, so its results have to be re-mapped back onto the
  // original row positions rather than read off by the original index.
  it("re-aligns fuzzy results back onto the original row order when exact and non-exact rows are interleaved", () => {
    const rows = [
      { date: "2026-07-01", amount: 10, type: "expense" as const }, // exact
      { date: "2026-07-10", amount: 45.9, type: "expense" as const }, // fuzzy match
      { date: "2026-07-02", amount: 20, type: "expense" as const }, // exact
      { date: "2026-07-20", amount: 99, type: "expense" as const }, // no match
    ];
    const isExactDuplicate = [true, false, true, false];
    const candidates = [{ id: "manual-1", date: "2026-07-09", amount: 45.9, type: "expense" as const }];

    expect(classifyDuplicateKinds(rows, isExactDuplicate, candidates)).toEqual([
      "exact",
      "fuzzy",
      "exact",
      null,
    ]);
  });
});

describe("dateWindowForBatch", () => {
  it("returns null for an empty batch", () => {
    expect(dateWindowForBatch([])).toBeNull();
  });

  it("widens the earliest/latest date by the matching window", () => {
    expect(dateWindowForBatch(["2026-07-10", "2026-07-03", "2026-07-15"])).toEqual({
      minDate: "2026-06-28",
      maxDate: "2026-07-20",
    });
  });
});
