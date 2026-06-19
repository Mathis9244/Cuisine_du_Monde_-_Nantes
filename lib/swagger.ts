type OpenApiPaths = Record<string, Record<string, unknown>>;

const errorResponse = {
  description: "Erreur",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: { error: { type: "string" } },
        required: ["error"],
      },
    },
  },
};

const idParameter = {
  in: "path",
  name: "id",
  required: true,
  schema: { type: "integer" },
  description: "Identifiant du restaurant",
};

const restaurantSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    rating: { type: "number", nullable: true },
    cuisine: { type: "string", nullable: true },
    address: { type: "string", nullable: true },
    city: { type: "string" },
    latitude: { type: "number", nullable: true },
    longitude: { type: "number", nullable: true },
    website: { type: "string", nullable: true },
    phone: { type: "string", nullable: true },
    is_active: { type: "boolean" },
  },
  required: ["id", "name"],
};

const publicPaths: OpenApiPaths = {
  "/api/restaurants": {
    get: {
      tags: ["Restaurants"],
      summary: "Lister les restaurants actifs",
      parameters: [
        { in: "query", name: "page", schema: { type: "integer", minimum: 1, default: 1 } },
        { in: "query", name: "limit", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
        { in: "query", name: "search", schema: { type: "string" } },
        { in: "query", name: "cuisine", schema: { type: "string" } },
        { in: "query", name: "sortBy", schema: { type: "string", enum: ["name", "rating", "createdAt"] } },
        { in: "query", name: "sortOrder", schema: { type: "string", enum: ["asc", "desc"], default: "asc" } },
      ],
      responses: {
        200: {
          description: "Liste paginée",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: { type: "array", items: restaurantSchema },
                  meta: {
                    type: "object",
                    properties: {
                      total: { type: "integer" },
                      page: { type: "integer" },
                      limit: { type: "integer" },
                      totalPages: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
        500: errorResponse,
      },
    },
  },
  "/api/restaurants/{id}": {
    get: {
      tags: ["Restaurants"],
      summary: "Consulter un restaurant actif",
      parameters: [idParameter],
      responses: {
        200: { description: "Restaurant", content: { "application/json": { schema: restaurantSchema } } },
        400: errorResponse,
        404: errorResponse,
        500: errorResponse,
      },
    },
    patch: {
      tags: ["Restaurants"],
      summary: "Modifier la note d’un restaurant",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [idParameter],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { rating: { type: "number", minimum: 0, maximum: 5 } },
              required: ["rating"],
            },
          },
        },
      },
      responses: { 200: { description: "Restaurant mis à jour" }, 400: errorResponse, 401: errorResponse, 404: errorResponse, 500: errorResponse },
    },
  },
  "/api/restaurants/cuisines": {
    get: {
      tags: ["Restaurants"],
      summary: "Lister les cuisines disponibles",
      responses: {
        200: {
          description: "Liste triée des cuisines",
          content: { "application/json": { schema: { type: "array", items: { type: "string" } } } },
        },
        500: errorResponse,
      },
    },
  },
  "/api/restaurants/stats": {
    get: {
      tags: ["Restaurants"],
      summary: "Obtenir les statistiques des restaurants",
      responses: { 200: { description: "Total et répartition par cuisine" }, 500: errorResponse },
    },
  },
  "/api/ai": {
    post: {
      tags: ["Assistant"],
      summary: "Interroger l’assistant culinaire",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { message: { type: "string" } },
              required: ["message"],
            },
          },
        },
      },
      responses: { 200: { description: "Réponse de l’assistant" }, 400: errorResponse, 500: errorResponse, 503: errorResponse },
    },
  },
  "/api/auth/me": {
    get: {
      tags: ["Compte"],
      summary: "Obtenir l’utilisateur connecté",
      security: [{ cookieAuth: [] }],
      responses: { 200: { description: "Profil courant et statut administrateur" }, 401: errorResponse },
    },
  },
  "/api/profile/avatar": {
    post: {
      tags: ["Compte"],
      summary: "Téléverser une photo de profil",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: { file: { type: "string", format: "binary" } },
              required: ["file"],
            },
          },
        },
      },
      responses: { 200: { description: "URL publique de l’avatar" }, 400: errorResponse, 401: errorResponse, 500: errorResponse },
    },
  },
};

const adminSecurity = [{ cookieAuth: [] }];

const adminPaths: OpenApiPaths = {
  "/api/admin/restaurants": {
    get: {
      tags: ["Administration"],
      summary: "Lister les restaurants pour l’administration",
      security: adminSecurity,
      parameters: [
        { in: "query", name: "page", schema: { type: "integer", minimum: 1, default: 1 } },
        { in: "query", name: "limit", schema: { type: "integer", minimum: 1, maximum: 200, default: 50 } },
        { in: "query", name: "search", schema: { type: "string" } },
        { in: "query", name: "cuisine", schema: { type: "string" } },
        { in: "query", name: "includeInactive", schema: { type: "boolean", default: false } },
      ],
      responses: { 200: { description: "Liste paginée, incluant éventuellement les inactifs" }, 401: errorResponse, 403: errorResponse, 500: errorResponse },
    },
    post: {
      tags: ["Administration"],
      summary: "Créer un restaurant",
      security: adminSecurity,
      requestBody: {
        required: true,
        content: { "application/json": { schema: restaurantSchema } },
      },
      responses: { 201: { description: "Restaurant créé" }, 400: errorResponse, 401: errorResponse, 403: errorResponse, 500: errorResponse },
    },
  },
  "/api/admin/restaurants/{id}": {
    get: {
      tags: ["Administration"],
      summary: "Consulter un restaurant, actif ou non",
      security: adminSecurity,
      parameters: [idParameter],
      responses: { 200: { description: "Restaurant" }, 400: errorResponse, 401: errorResponse, 403: errorResponse, 404: errorResponse, 500: errorResponse },
    },
    put: {
      tags: ["Administration"],
      summary: "Modifier un restaurant",
      security: adminSecurity,
      parameters: [idParameter],
      requestBody: { required: true, content: { "application/json": { schema: restaurantSchema } } },
      responses: { 200: { description: "Restaurant modifié" }, 400: errorResponse, 401: errorResponse, 403: errorResponse, 500: errorResponse },
    },
  },
  "/api/admin/restaurants/{id}/activate": {
    patch: {
      tags: ["Administration"],
      summary: "Activer un restaurant",
      security: adminSecurity,
      parameters: [idParameter],
      responses: { 200: { description: "Restaurant activé" }, 400: errorResponse, 401: errorResponse, 403: errorResponse, 500: errorResponse },
    },
  },
  "/api/admin/restaurants/{id}/deactivate": {
    patch: {
      tags: ["Administration"],
      summary: "Désactiver un restaurant",
      security: adminSecurity,
      parameters: [idParameter],
      responses: { 200: { description: "Restaurant désactivé" }, 400: errorResponse, 401: errorResponse, 403: errorResponse, 500: errorResponse },
    },
  },
  "/api/admin/restaurants/export/csv": {
    get: {
      tags: ["Administration"],
      summary: "Exporter les restaurants actifs en CSV",
      security: adminSecurity,
      parameters: [
        { in: "query", name: "excludeFrench", schema: { type: "boolean", default: false } },
      ],
      responses: {
        200: { description: "Fichier CSV", content: { "text/csv": { schema: { type: "string" } } } },
        401: errorResponse,
        403: errorResponse,
        500: errorResponse,
      },
    },
  },
};

export function createSwaggerSpec(includeAdmin: boolean) {
  return {
    openapi: "3.0.0",
    info: {
      title: "Cuisine du Monde API",
      version: "1.1.0",
      description: "Documentation de l’API Next.js de Cuisine du Monde Nantes.",
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        description: "Serveur de l’application",
      },
    ],
    tags: [
      { name: "Restaurants", description: "Consultation des restaurants" },
      { name: "Assistant", description: "Assistant culinaire" },
      { name: "Compte", description: "Compte et profil utilisateur" },
      ...(includeAdmin
        ? [{ name: "Administration", description: "Endpoints réservés aux administrateurs" }]
        : []),
    ],
    components: {
      securitySchemes: {
        cookieAuth: { type: "apiKey", in: "cookie", name: "sb-access-token" },
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: { Restaurant: restaurantSchema },
    },
    paths: {
      ...publicPaths,
      ...(includeAdmin ? adminPaths : {}),
    },
  };
}

export const swaggerSpec = createSwaggerSpec(false);
