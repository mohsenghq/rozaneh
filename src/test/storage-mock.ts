type ItemOptions<T> = { fallback?: T; defaultValue?: T };

const values = new Map<string, unknown>();

export const storage = {
  defineItem<T>(key: string, opts?: ItemOptions<T>) {
    return {
      key,
      fallback: opts?.fallback,
      get defaultValue() {
        return opts?.fallback;
      },
      async getValue(): Promise<T> {
        return (values.has(key) ? values.get(key) : opts?.fallback) as T;
      },
      async setValue(value: T) {
        values.set(key, value);
      },
      async removeValue() {
        values.delete(key);
      },
      watch() {
        return () => {};
      },
      async migrate() {},
    };
  },
};
