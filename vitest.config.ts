import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["src/domain/**/*.test.ts"],
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    // Domain tests hit a real local Postgres via the Supabase CLI stack —
    // sequential run avoids cross-test data races against the same DB.
    fileParallelism: false,
  },
});
