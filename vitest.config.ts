import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const mock = (file: string) => fileURLToPath(new URL(file, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Unit tests run in Node, but the app is built for an extension.
      "wxt/utils/storage": mock("./src/test/storage-mock.ts"),
      "wxt/browser": mock("./src/test/browser-mock.ts"),
      "@wxt-dev/browser": mock("./src/test/browser-mock.ts"),
    },
  },
  test: {
    environment: "node",
  },
});
