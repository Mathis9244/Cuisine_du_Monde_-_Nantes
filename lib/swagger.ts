export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Cuisine du Monde API",
    version: "1.0.0",
    description:
      "Documentation Swagger de l’API Next.js de Cuisine du Monde Nantes.",
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      description: "Environnement local",
    },
  ],
  tags: [
    {
      name: "Restaurants",
      description: "Endpoints de consultation des restaurants",
    },
  ],
  paths: {
    "/api/restaurants": {
      get: {
        tags: ["Restaurants"],
        summary: "Lister les restaurants",
        description:
          "Retourne la liste paginée des restaurants actifs avec leurs métadonnées.",
        parameters: [
          {
            in: "query",
            name: "page",
            schema: { type: "integer", minimum: 1, default: 1 },
            description: "Numéro de page",
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            description: "Nombre d’éléments par page",
          },
          {
            in: "query",
            name: "search",
            schema: { type: "string" },
            description: "Filtre texte sur le nom, l’adresse ou la cuisine",
          },
          {
            in: "query",
            name: "cuisine",
            schema: { type: "string" },
            description: "Filtre cuisine (ex. Japonais)",
          },
          {
            in: "query",
            name: "sortBy",
            schema: { type: "string", enum: ["name", "rating", "createdAt"] },
            description: "Critère de tri",
          },
          {
            in: "query",
            name: "sortOrder",
            schema: { type: "string", enum: ["asc", "desc"], default: "asc" },
            description: "Ordre de tri",
          },
        ],
        responses: {
          200: {
            description: "Liste des restaurants retournée avec la pagination",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          country: { type: "string" },
                          cuisine: { type: "string" },
                          specialty: { type: "string" },
                          rating: { type: "number" },
                          website: { type: "string" },
                          address: { type: "string" },
                        },
                      },
                    },
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
          500: {
            description: "Erreur serveur",
          },
        },
      },
    },
  },
} as const;
