import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    testTimeout: 10000, // 10 second timeout per test
    hookTimeout: 10000, // 10 second timeout for hooks
    teardownTimeout: 5000, // 5 second timeout for teardown
    bail: 0, // Don't bail on first failure
    logHeapUsage: false,
    silent: false,
    env: {
      NODE_ENV: "test",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/dist/**",
        "**/.next/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "./src"),
    },
  },
});

