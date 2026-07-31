import { config } from "dotenv";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

config({ path: ".env.test.local" });

afterEach(cleanup);
