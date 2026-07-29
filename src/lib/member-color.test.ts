import { describe, expect, it } from "vitest";
import { memberAccent } from "./member-color";

describe("memberAccent", () => {
  it("maps member index 0 and 1 to two distinct fixed colors", () => {
    const first = memberAccent(0);
    const second = memberAccent(1);

    expect(first.color).toBe("var(--member-1)");
    expect(second.color).toBe("var(--member-2)");
    expect(first).not.toEqual(second);
  });

  it("is deterministic across calls", () => {
    expect(memberAccent(0)).toEqual(memberAccent(0));
    expect(memberAccent(1)).toEqual(memberAccent(1));
  });
});
