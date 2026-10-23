import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  vite: () => ({
    plugins: [tailwindcss()],
    server: {
      cors: true,
    },
  }),
  manifest: {
    name: "Rozaneh",
    description: "Rozaneh - a light, private new tab with clock, tri-calendar and weather.",
    action: {
      default_title: "Rozaneh",
    },
    permissions: ["storage", "favicon"],
    optional_permissions: ["bookmarks", "topSites"],
    host_permissions: ["https://www.bing.com/*"],
    browser_specific_settings: {
      gecko: {
        id: "Rozaneh-tab@Rozaneh-tab.app",
        strict_min_version: "120.0",
        data_collection_permissions: { required: ["locationInfo"] },
      },
    },
  },
});
