// Minimal preview server for the built extension.
//
// Usage (from the repository root):
//   pnpm build
//   node .opencode/skills/rozaneh/scripts/preview-server.mjs .output/chrome-mv3
//
// Open http://localhost:4173/ for the new tab, /popup.html for the popup.
// The server injects a small mock `chrome` API before the app bundle so UI
// work can be checked without loading the extension into a real browser.
// The mock is intentionally not a full WebExtension implementation.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const root = resolve(process.argv[2] ?? ".output/chrome-mv3");
const port = Number(process.env.PORT ?? 4173);

const mock = `
<script>
(() => {
  const KEY = "__rozaneh_preview_storage__";
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
  const write = (value) => localStorage.setItem(KEY, JSON.stringify(value));
  const changed = [];
  const pick = (keys, all) => {
    if (keys == null) return all;
    if (typeof keys === "string") return { [keys]: all[keys] };
    if (Array.isArray(keys)) return Object.fromEntries(keys.map((key) => [key, all[key]]));
    return Object.fromEntries(Object.keys(keys).map((key) => [key, all[key] ?? keys[key]]));
  };
  const area = {
    async get(keys) { return pick(keys, read()); },
    async set(items) {
      const all = { ...read(), ...items };
      write(all);
      const changes = Object.fromEntries(Object.keys(items).map((key) => [key, { newValue: items[key] }]));
      changed.forEach((listener) => { try { listener(changes, "local"); } catch {} });
    },
    async remove(keys) {
      const all = read();
      for (const key of Array.isArray(keys) ? keys : [keys]) delete all[key];
      write(all);
    },
    async clear() { write({}); },
  };
  const permissions = new Set(JSON.parse(localStorage.getItem("__rozaneh_permissions__") || "[]"));
  const topSites = [
    { title: "GitHub", url: "https://github.com/" },
    { title: "Stack Overflow", url: "https://stackoverflow.com/" },
    { title: "Wikipedia", url: "https://fa.wikipedia.org/" },
    { title: "YouTube", url: "https://www.youtube.com/" },
    { title: "Figma", url: "https://www.figma.com/" },
  ];
  globalThis.chrome = {
    runtime: {
      id: "preview-extension",
      getURL: (path) => path,
      getManifest: () => ({ manifest_version: 3, version: "1.0.0" }),
      lastError: null,
    },
    storage: {
      local: area, session: area, sync: area,
      onChanged: {
        addListener: (listener) => changed.push(listener),
        removeListener: (listener) => { const i = changed.indexOf(listener); if (i >= 0) changed.splice(i, 1); },
      },
    },
    permissions: {
      async contains({ permissions: list }) { return list.every((name) => permissions.has(name)); },
      async request({ permissions: list }) {
        list.forEach((name) => permissions.add(name));
        localStorage.setItem("__rozaneh_permissions__", JSON.stringify([...permissions]));
        return true;
      },
      async remove({ permissions: list }) {
        list.forEach((name) => permissions.delete(name));
        localStorage.setItem("__rozaneh_permissions__", JSON.stringify([...permissions]));
        return true;
      },
    },
    topSites: { async get() { return topSites; } },
    bookmarks: { async getTree() { return [{ id: "0", title: "", children: [] }]; } },
    tabs: { async create() { return {}; } },
    i18n: { getMessage: () => "" },
  };
})();
</script>`;

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

createServer(async (request, response) => {
  try {
    const urlPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (urlPath === "/" || urlPath.endsWith(".html")) {
      const file = urlPath === "/" ? "newtab.html" : urlPath.replace(/^\//, "");
      const html = await readFile(join(root, file), "utf8");
      response.writeHead(200, { "content-type": types[".html"], "cache-control": "no-store" });
      response.end(html.replace("</head>", mock + "</head>"));
      return;
    }

    const file = join(root, urlPath);
    if (!file.startsWith(root)) {
      response.writeHead(403);
      response.end("forbidden");
      return;
    }
    const info = await stat(file).catch(() => null);
    if (!info?.isFile()) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    response.writeHead(200, {
      "content-type": types[extname(file)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(await readFile(file));
  } catch (error) {
    response.writeHead(500);
    response.end(String(error));
  }
}).listen(port, () => {
  console.log(`Rozaneh preview: http://localhost:${port}/`);
  console.log(`Popup preview:    http://localhost:${port}/popup.html`);
  console.log(`Serving:          ${root}`);
});
