import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// Test runner for the Business Invariant Tests (approved decision D2: Vitest).
// The framework is a tool; the Business Invariant Tests are the company asset.
export default defineConfig({
  test: {
    include: ["test/invariants/**/*.spec.ts"],
    environment: "node",
    // Invariant tests run against ONE real Postgres database (three of the six
    // invariants ARE partial-index semantics and cannot be faked in-memory).
    // Each file resets the database, so files must never run in parallel.
    fileParallelism: false,
    pool: "forks",
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  plugins: [
    // SWC compiles the real Nest services (esbuild cannot emit the decorator
    // metadata that @nestjs/* decorators require).
    swc.vite({
      module: { type: "es6" },
      jsc: {
        target: "es2021",
        parser: { syntax: "typescript", decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
});
