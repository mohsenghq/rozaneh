import { describe, expect, it } from "vitest";
import { mergeAutoShortcuts } from "./autoShortcuts";
import type { Shortcut } from "./shortcuts";

const manual: Shortcut[] = [
  { id: "a", title: "YouTube", url: "https://youtube.com", icon: "", source: "user" },
  { id: "b", title: "Gmail", url: "https://mail.google.com", icon: "", source: "user" },
];

describe("mergeAutoShortcuts", () => {
  it("appends new top sites after manual items", () => {
    const result = mergeAutoShortcuts(
      manual,
      [
        { url: "https://github.com/", title: "GitHub" },
        { url: "https://www.youtube.com/feed", title: "YouTube" },
      ],
      [],
      10,
    );
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("a");
    expect(result[2]).toMatchObject({ title: "GitHub", source: "auto" });
  });

  it("deduplicates by hostname", () => {
    const result = mergeAutoShortcuts(
      manual,
      [
        { url: "https://example.com/a", title: "Example A" },
        { url: "https://www.example.com/b", title: "Example B" },
      ],
      [],
      10,
    );
    expect(result).toHaveLength(3);
  });

  it("never re-adds a dismissed host", () => {
    const result = mergeAutoShortcuts(
      manual,
      [{ url: "https://example.com/", title: "Example" }],
      ["example.com"],
      10,
    );
    expect(result).toHaveLength(2);
  });

  it("respects capacity", () => {
    const result = mergeAutoShortcuts(
      manual,
      [
        { url: "https://a.example/", title: "A" },
        { url: "https://b.example/", title: "B" },
      ],
      [],
      3,
    );
    expect(result).toHaveLength(3);
  });

  it("ignores non-http and invalid URLs", () => {
    const result = mergeAutoShortcuts(
      manual,
      [
        { url: "chrome://settings", title: "Settings" },
        { url: "about:blank", title: "Blank" },
        { url: "not a url", title: "Bad" },
      ],
      [],
      10,
    );
    expect(result).toHaveLength(2);
  });
});
