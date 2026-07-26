import { describe, expect, it } from "vitest";
import { APP_NAME, APP_SHORT_NAME, APP_THEME_COLOR } from "./app-info";
import manifest from "./manifest";

describe("manifest", () => {
  it("declares a standalone, installable pt-BR web app manifest", () => {
    const result = manifest();

    expect(result.name).toBe(APP_NAME);
    expect(result.short_name).toBe(APP_SHORT_NAME);
    expect(result.lang).toBe("pt-BR");
    expect(result.display).toBe("standalone");
    expect(result.start_url).toBe("/");
    expect(result.theme_color).toBe(APP_THEME_COLOR);
  });

  it("includes 192x192 and 512x512 icons, plus a maskable variant", () => {
    const { icons } = manifest();

    expect(icons).toBeDefined();
    const sizes = (icons ?? []).map((icon) => icon.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");

    const maskable = (icons ?? []).find((icon) => icon.purpose === "maskable");
    expect(maskable).toBeDefined();
    expect(maskable?.sizes).toBe("512x512");
  });
});
