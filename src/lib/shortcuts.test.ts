import { describe, expect, it } from "vitest";
import { shortLabel } from "./shortcuts";

describe("shortLabel", () => {
  it("keeps a one-word brand name exactly as written", () => {
    expect(shortLabel("BALE", "https://bale.ai")).toBe("BALE");
    expect(shortLabel("cloudflare", "https://cloudflare.com")).toBe("cloudflare");
    expect(shortLabel("ChatGPT", "https://chatgpt.com")).toBe("ChatGPT");
  });

  it("uses the first word of a multi-word title", () => {
    expect(shortLabel("Stack Overflow", "https://stackoverflow.com")).toBe("Stack");
    expect(shortLabel("Google Drive", "https://drive.google.com")).toBe("Google");
  });

  it("skips weak leading words and uses the next useful word", () => {
    expect(shortLabel("The Verge", "https://theverge.com")).toBe("Verge");
    expect(shortLabel("My Bank", "https://bank.example.com")).toBe("Bank");
  });

  it("falls back to the hostname when the title is empty", () => {
    expect(shortLabel("", "https://example.com/path")).toBe("example");
  });
});
