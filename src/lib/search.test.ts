import { describe, expect, it } from "vitest";
import { directFaviconUrl, isSafeIconUrl, normalizeUrl } from "./search";

describe("URL helpers", () => {
  it("normalizes URLs with a missing scheme", () => {
    expect(normalizeUrl("github.com")).toBe("https://github.com");
  });

  it("builds a direct favicon URL for the site itself", () => {
    expect(directFaviconUrl("https://www.github.com/features")).toBe(
      "https://www.github.com/favicon.ico",
    );
  });

  it("accepts only image data URLs and http(s) icons", () => {
    expect(isSafeIconUrl("https://example.com/icon.png")).toBe(true);
    expect(isSafeIconUrl("data:image/png;base64,AAAA")).toBe(true);
    expect(isSafeIconUrl("data:image/svg+xml,<svg/>")).toBe(true);
    expect(isSafeIconUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeIconUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeIconUrl("file:///C:/icon.png")).toBe(false);
  });
});
