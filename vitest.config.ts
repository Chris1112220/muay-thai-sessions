import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Sandcastle worktrees are full copies of the repo; their tests are not ours.
    exclude: [...configDefaults.exclude, ".sandcastle/**"],
  },
});
