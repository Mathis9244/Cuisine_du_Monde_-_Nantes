import { describe, expect, it } from "vitest";
import { createSwaggerSpec } from "@/lib/swagger";

const publicRoutes = [
  "/api/ai",
  "/api/auth/me",
  "/api/profile/avatar",
  "/api/restaurants",
  "/api/restaurants/{id}",
  "/api/restaurants/cuisines",
  "/api/restaurants/stats",
];

const adminRoutes = [
  "/api/admin/restaurants",
  "/api/admin/restaurants/{id}",
  "/api/admin/restaurants/{id}/activate",
  "/api/admin/restaurants/{id}/deactivate",
  "/api/admin/restaurants/export/csv",
];

describe("createSwaggerSpec", () => {
  it("documente toutes les routes publiques sans exposer les routes admin", () => {
    const spec = createSwaggerSpec(false);
    const paths = Object.keys(spec.paths).sort();

    expect(paths).toEqual(publicRoutes.sort());
    expect(paths.some((path) => path.startsWith("/api/admin"))).toBe(false);
  });

  it("ajoute toutes les routes admin pour un administrateur", () => {
    const spec = createSwaggerSpec(true);
    const paths = Object.keys(spec.paths).sort();

    expect(paths).toEqual([...publicRoutes, ...adminRoutes].sort());
  });

  it("documente les méthodes réellement disponibles", () => {
    const spec = createSwaggerSpec(true);

    expect(Object.keys(spec.paths["/api/restaurants/{id}"])).toEqual([
      "get",
      "patch",
    ]);
    expect(Object.keys(spec.paths["/api/admin/restaurants"])).toEqual([
      "get",
      "post",
    ]);
    expect(Object.keys(spec.paths["/api/admin/restaurants/{id}"])).toEqual([
      "get",
      "put",
    ]);
  });
});
