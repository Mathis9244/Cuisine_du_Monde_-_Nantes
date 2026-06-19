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

  it("explique comment utiliser chaque opération", () => {
    const spec = createSwaggerSpec(true);

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        const documentedOperation = operation as {
          operationId?: string;
          summary?: string;
          description?: string;
        };

        expect(documentedOperation.operationId, `${method.toUpperCase()} ${path}`).toBeTruthy();
        expect(documentedOperation.summary, `${method.toUpperCase()} ${path}`).toBeTruthy();
        expect(documentedOperation.description, `${method.toUpperCase()} ${path}`).toBeTruthy();
      }
    }
  });

  it("décrit et préremplit chaque paramètre", () => {
    const spec = createSwaggerSpec(true);

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        const parameters = (operation as {
          parameters?: Array<{ name?: string; description?: string; example?: unknown }>;
        }).parameters ?? [];

        for (const parameter of parameters) {
          const label = `${method.toUpperCase()} ${path} — ${parameter.name}`;
          expect(parameter.description, label).toBeTruthy();
          expect(parameter.example, label).not.toBeUndefined();
        }
      }
    }
  });

  it("fournit des exemples pour les corps de requête et les réponses réussies", () => {
    const spec = createSwaggerSpec(true);

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        const documentedOperation = operation as {
          requestBody?: {
            content?: Record<string, { example?: unknown }>;
          };
          responses?: Record<string, {
            content?: Record<string, { example?: unknown }>;
          }>;
        };
        const label = `${method.toUpperCase()} ${path}`;

        for (const media of Object.values(documentedOperation.requestBody?.content ?? {})) {
          expect(media.example, `${label} request`).not.toBeUndefined();
        }

        const success = documentedOperation.responses?.["200"] ??
          documentedOperation.responses?.["201"];
        expect(success, `${label} success response`).toBeTruthy();
        for (const media of Object.values(success?.content ?? {})) {
          expect(media.example, `${label} response`).not.toBeUndefined();
        }
      }
    }
  });
});
