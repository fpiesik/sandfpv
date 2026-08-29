import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative assets work both at the domain root and below a Pages repository path.
  base: "./",
  test: { environment: "node" },
});
