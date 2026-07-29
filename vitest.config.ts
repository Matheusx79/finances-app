import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["src/domain/**/*.test.ts", "src/app/**/*.test.ts", "src/lib/**/*.test.ts"],
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    // Domain tests hit a real local Postgres via the Supabase CLI stack —
    // sequential run avoids cross-test data races against the same DB.
    // (Non-domain tests, like src/app/manifest.test.ts, don't need this but
    // are cheap enough that running everything sequentially is a non-issue.)
    fileParallelism: false,
  },
});
