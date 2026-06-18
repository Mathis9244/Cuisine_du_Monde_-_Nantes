import { describe, expect, it } from "vitest";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

describe("promote admin email", () => {
  it("normalizes email for lookup", () => {
    expect(normalizeEmail("  Admin@Example.COM ")).toBe("admin@example.com");
  });
});
