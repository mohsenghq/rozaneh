const store = new Map<string, unknown>();

function read(keys: unknown): Record<string, unknown> {
  if (keys == null) return Object.fromEntries(store);
  if (typeof keys === "string") return { [keys]: store.get(keys) };
  if (Array.isArray(keys)) {
    return Object.fromEntries(keys.map((key) => [key, store.get(key)]));
  }
  if (typeof keys === "object") {
    return Object.fromEntries(
      Object.entries(keys as Record<string, unknown>).map(([key, fallback]) => [
        key,
        store.has(key) ? store.get(key) : fallback,
      ]),
    );
  }
  return {};
}

const area = {
  async get(keys?: unknown) {
    return read(keys);
  },
  async set(items: Record<string, unknown>) {
    for (const [key, value] of Object.entries(items)) store.set(key, value);
  },
  async remove(keys: string | string[]) {
    for (const key of Array.isArray(keys) ? keys : [keys]) store.delete(key);
  },
  async clear() {
    store.clear();
  },
};

export const browser = {
  runtime: {
    id: "test-extension",
    getURL: (path: string) => path,
    getManifest: () => ({ manifest_version: 3 }),
  },
  storage: {
    local: area,
    session: area,
    sync: area,
    onChanged: {
      addListener() {},
      removeListener() {},
    },
  },
  permissions: {
    async contains() {
      return false;
    },
    async request() {
      return false;
    },
    async remove() {
      return false;
    },
  },
  topSites: {
    async get() {
      return [];
    },
  },
  bookmarks: {
    async getTree() {
      return [{ id: "0", title: "", children: [] }];
    },
  },
};
