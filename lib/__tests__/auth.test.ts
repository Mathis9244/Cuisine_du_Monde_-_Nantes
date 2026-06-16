import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { User } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/auth";

function mockUser(metadata: {
  appRole?: string;
  userRole?: string;
}): User {
  return {
    id: "user-1",
    app_metadata: metadata.appRole ? { role: metadata.appRole } : {},
    user_metadata: metadata.userRole ? { role: metadata.userRole } : {},
  } as User;
}

describe("isAdmin", () => {
  const originalAdminRole = process.env.ADMIN_ROLE;

  beforeEach(() => {
    process.env.ADMIN_ROLE = "admin";
  });

  afterEach(() => {
    process.env.ADMIN_ROLE = originalAdminRole;
  });

  it("retourne false sans utilisateur", () => {
    expect(isAdmin(null)).toBe(false);
  });

  it("détecte le rôle admin dans app_metadata", () => {
    expect(isAdmin(mockUser({ appRole: "admin" }))).toBe(true);
  });

  it("détecte le rôle admin dans user_metadata", () => {
    expect(isAdmin(mockUser({ userRole: "admin" }))).toBe(true);
  });

  it("retourne false pour un utilisateur standard", () => {
    expect(isAdmin(mockUser({ appRole: "user" }))).toBe(false);
  });

  it("respecte ADMIN_ROLE personnalisé", async () => {
    vi.stubEnv("ADMIN_ROLE", "superadmin");
    vi.resetModules();
    const { isAdmin: isAdminReloaded } = await import("@/lib/auth");
    expect(isAdminReloaded(mockUser({ appRole: "superadmin" }))).toBe(true);
    expect(isAdminReloaded(mockUser({ appRole: "admin" }))).toBe(false);
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});
