type OpenApiPaths = Record<string, Record<string, unknown>>;

const restaurantExample = {
  id: "42",
  name: "Tokyo Kitchen",
  country: "Japan",
  address: "12 rue de Strasbourg, Nantes",
  imageUrl: "https://images.unsplash.com/example",
  specialty: "Japanese",
  description: "Tokyo Kitchen — cuisine japanese à Nantes.",
  rating: 4.6,
  website: "https://tokyo-kitchen.example",
  phone: "+33240123456",
  latitude: 47.2184,
  longitude: -1.5536,
};

const databaseRestaurantExample = {
  id: 42,
  name: "Tokyo Kitchen",
  rating: 4.6,
  cuisine: "japanese",
  address: "12 rue de Strasbourg",
  city: "Nantes",
  latitude: 47.2184,
  longitude: -1.5536,
  website: "https://tokyo-kitchen.example",
  phone: "+33240123456",
  source: "manual",
  source_id: null,
  is_active: true,
  created_at: "2026-06-19T08:00:00.000Z",
  updated_at: "2026-06-19T08:00:00.000Z",
};

const errorSchema = {
  type: "object",
  properties: {
    error: {
      type: "string",
      description: "Message expliquant pourquoi la requête a échoué.",
    },
  },
  required: ["error"],
};

function errorResponse(description: string, example: string) {
  return {
    description,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
        example: { error: example },
      },
    },
  };
}

function jsonResponse(description: string, schema: unknown, example: unknown) {
  return {
    description,
    content: {
      "application/json": { schema, example },
    },
  };
}

const idParameter = {
  in: "path",
  name: "id",
  required: true,
  description: "Identifiant numérique du restaurant, visible dans les réponses de l’API.",
  example: 42,
  schema: { type: "integer", minimum: 1 },
};

const publicRestaurantSchema = {
  type: "object",
  description: "Restaurant formaté pour être consommé par l’interface publique.",
  properties: {
    id: { type: "string", example: "42" },
    name: { type: "string", example: "Tokyo Kitchen" },
    country: { type: "string", example: "Japan" },
    address: { type: "string", example: "12 rue de Strasbourg, Nantes" },
    imageUrl: { type: "string", format: "uri" },
    specialty: { type: "string", example: "Japanese" },
    description: { type: "string" },
    rating: { type: "number", minimum: 0, maximum: 5, nullable: true },
    website: { type: "string", format: "uri", nullable: true },
    phone: { type: "string", nullable: true },
    latitude: { type: "number", nullable: true },
    longitude: { type: "number", nullable: true },
  },
  required: ["id", "name", "country", "address", "imageUrl", "specialty", "description"],
};

const databaseRestaurantSchema = {
  type: "object",
  description: "Ligne complète telle qu’elle est stockée dans Supabase.",
  properties: {
    id: { type: "integer", readOnly: true },
    name: { type: "string" },
    rating: { type: "number", minimum: 0, maximum: 5, nullable: true },
    cuisine: { type: "string", nullable: true, example: "japanese" },
    address: { type: "string", nullable: true },
    city: { type: "string", default: "Nantes" },
    latitude: { type: "number", nullable: true },
    longitude: { type: "number", nullable: true },
    website: { type: "string", format: "uri", nullable: true },
    phone: { type: "string", nullable: true },
    source: { type: "string", nullable: true },
    source_id: { type: "string", nullable: true },
    is_active: { type: "boolean", readOnly: true },
    created_at: { type: "string", format: "date-time", readOnly: true },
    updated_at: { type: "string", format: "date-time", readOnly: true },
  },
  required: ["name"],
};

const restaurantInputSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "Nom public du restaurant.",
      example: "Tokyo Kitchen",
    },
    rating: {
      type: "number",
      nullable: true,
      minimum: 0,
      maximum: 5,
      description: "Note comprise entre 0 et 5.",
      example: 4.6,
    },
    cuisine: {
      type: "string",
      nullable: true,
      description: "Type de cuisine, généralement stocké en anglais et en minuscules.",
      example: "japanese",
    },
    address: { type: "string", nullable: true, example: "12 rue de Strasbourg" },
    city: { type: "string", default: "Nantes", example: "Nantes" },
    latitude: { type: "number", nullable: true, example: 47.2184 },
    longitude: { type: "number", nullable: true, example: -1.5536 },
    website: {
      type: "string",
      format: "uri",
      nullable: true,
      example: "https://tokyo-kitchen.example",
    },
    phone: { type: "string", nullable: true, example: "+33240123456" },
  },
  required: ["name"],
};

const sessionSecurity = [{ cookieAuth: [] }];
const adminSecurity = [{ cookieAuth: [] }];

const publicPaths: OpenApiPaths = {
  "/api/restaurants": {
    get: {
      operationId: "listRestaurants",
      tags: ["Restaurants"],
      summary: "Lister et filtrer les restaurants actifs",
      description:
        "Route publique principale. Elle retourne uniquement les restaurants actifs, avec pagination. Les filtres peuvent être combinés, par exemple `?cuisine=japanese&sortBy=rating&sortOrder=desc`. Le champ `cuisine` filtre sans tenir compte de la casse.",
      parameters: [
        {
          in: "query",
          name: "page",
          description: "Numéro de la page à retourner. Une valeur inférieure à 1 est ramenée à 1.",
          example: 1,
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          in: "query",
          name: "limit",
          description: "Nombre maximal de restaurants par page. Le serveur plafonne la valeur à 100.",
          example: 20,
          schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        },
        {
          in: "query",
          name: "search",
          description: "Recherche partielle dans le nom, l’adresse et le type de cuisine.",
          example: "sushi",
          schema: { type: "string" },
        },
        {
          in: "query",
          name: "cuisine",
          description: "Filtre exact, insensible à la casse, sur le type de cuisine stocké en base.",
          example: "japanese",
          schema: { type: "string" },
        },
        {
          in: "query",
          name: "sortBy",
          description: "Colonne utilisée pour trier les résultats.",
          example: "rating",
          schema: { type: "string", enum: ["name", "rating", "createdAt"], default: "name" },
        },
        {
          in: "query",
          name: "sortOrder",
          description: "Ordre croissant (`asc`) ou décroissant (`desc`).",
          example: "desc",
          schema: { type: "string", enum: ["asc", "desc"], default: "asc" },
        },
      ],
      responses: {
        200: jsonResponse(
          "Liste paginée des restaurants actifs.",
          {
            type: "object",
            properties: {
              data: { type: "array", items: { $ref: "#/components/schemas/Restaurant" } },
              meta: { $ref: "#/components/schemas/Pagination" },
            },
          },
          {
            data: [restaurantExample],
            meta: { total: 37, page: 1, limit: 20, totalPages: 2 },
          },
        ),
        500: errorResponse("Erreur lors de la lecture de la base.", "Database connection failed"),
      },
    },
  },
  "/api/restaurants/{id}": {
    get: {
      operationId: "getRestaurant",
      tags: ["Restaurants"],
      summary: "Consulter un restaurant actif",
      description:
        "Retourne un restaurant à partir de son identifiant. Un restaurant désactivé est volontairement traité comme introuvable sur cette route publique.",
      parameters: [idParameter],
      responses: {
        200: jsonResponse(
          "Restaurant demandé.",
          { $ref: "#/components/schemas/Restaurant" },
          restaurantExample,
        ),
        400: errorResponse("L’identifiant n’est pas numérique.", "Identifiant invalide"),
        404: errorResponse("Le restaurant n’existe pas ou est inactif.", "Restaurant introuvable"),
        500: errorResponse("Erreur lors de la lecture de la base.", "Database connection failed"),
      },
    },
    patch: {
      operationId: "rateRestaurant",
      tags: ["Restaurants"],
      summary: "Modifier la note d’un restaurant",
      description:
        "Nécessite une session Supabase valide dans les cookies du navigateur. Envoyez un JSON contenant uniquement `rating`, compris entre 0 et 5. Dans Swagger, connectez-vous d’abord dans l’application dans le même navigateur.",
      security: sessionSecurity,
      parameters: [idParameter],
      requestBody: {
        required: true,
        description: "Nouvelle note du restaurant.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                rating: {
                  type: "number",
                  minimum: 0,
                  maximum: 5,
                  description: "Nouvelle note, bornes incluses.",
                },
              },
              required: ["rating"],
            },
            example: { rating: 4.8 },
          },
        },
      },
      responses: {
        200: jsonResponse(
          "Restaurant avec sa nouvelle note.",
          { $ref: "#/components/schemas/Restaurant" },
          { ...restaurantExample, rating: 4.8 },
        ),
        400: errorResponse("Note ou identifiant invalide.", "Note invalide"),
        401: errorResponse("Aucune session Supabase valide.", "Non autorisé"),
        404: errorResponse("Restaurant actif introuvable.", "Restaurant introuvable"),
        500: errorResponse("Erreur lors de la mise à jour.", "Database update failed"),
      },
    },
  },
  "/api/restaurants/cuisines": {
    get: {
      operationId: "listCuisines",
      tags: ["Restaurants"],
      summary: "Lister les cuisines disponibles",
      description:
        "Retourne les valeurs uniques du champ `cuisine` pour les restaurants actifs. Cette liste peut servir à construire un filtre avant d’appeler `/api/restaurants`.",
      responses: {
        200: jsonResponse(
          "Liste alphabétique sans doublons.",
          { type: "array", items: { type: "string" } },
          ["chinese", "indian", "italian", "japanese", "vietnamese"],
        ),
        500: errorResponse("Erreur lors de la lecture de la base.", "Database connection failed"),
      },
    },
  },
  "/api/restaurants/stats": {
    get: {
      operationId: "getRestaurantStats",
      tags: ["Restaurants"],
      summary: "Obtenir les statistiques des restaurants actifs",
      description:
        "Retourne le nombre total de restaurants actifs et leur répartition par cuisine, triée de la cuisine la plus représentée à la moins représentée.",
      responses: {
        200: jsonResponse(
          "Statistiques courantes.",
          {
            type: "object",
            properties: {
              total: { type: "integer" },
              byCuisine: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    cuisine: { type: "string" },
                    count: { type: "integer" },
                  },
                },
              },
            },
          },
          {
            total: 37,
            byCuisine: [
              { cuisine: "japanese", count: 9 },
              { cuisine: "italian", count: 7 },
            ],
          },
        ),
        500: errorResponse("Erreur lors de la lecture de la base.", "Database connection failed"),
      },
    },
  },
  "/api/ai": {
    post: {
      operationId: "askCulinaryAssistant",
      tags: ["Assistant"],
      summary: "Interroger l’assistant culinaire",
      description:
        "Envoie une question en français ou en anglais à l’assistant. Le serveur ajoute automatiquement les restaurants actifs comme contexte : il ne faut donc pas transmettre la liste des restaurants dans la requête.",
      requestBody: {
        required: true,
        description: "Question destinée à l’assistant culinaire.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  minLength: 1,
                  description: "Question ou préférence culinaire.",
                },
              },
              required: ["message"],
            },
            example: { message: "Où manger japonais près du centre de Nantes ?" },
          },
        },
      },
      responses: {
        200: jsonResponse(
          "Réponse textuelle de l’assistant.",
          {
            type: "object",
            properties: { reply: { type: "string" } },
            required: ["reply"],
          },
          { reply: "Je vous recommande Tokyo Kitchen, bien noté et situé près du centre." },
        ),
        400: errorResponse("Le JSON est invalide ou le message est vide.", "Message vide"),
        500: errorResponse("Le fournisseur IA n’a pas pu répondre.", "NVIDIA API error (500)"),
        503: errorResponse("La clé du fournisseur IA n’est pas configurée.", "Assistant IA non configuré (NVIDIA_API_KEY manquant)."),
      },
    },
  },
  "/api/auth/me": {
    get: {
      operationId: "getCurrentUser",
      tags: ["Compte"],
      summary: "Obtenir l’utilisateur connecté",
      description:
        "Lit la session Supabase dans les cookies du navigateur. La réponse indique notamment `isAdmin`, calculé côté serveur depuis `app_metadata.role`. Connectez-vous dans l’application avant de tester cette route dans Swagger.",
      security: sessionSecurity,
      responses: {
        200: jsonResponse(
          "Informations minimales sur le compte courant.",
          {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              email: { type: "string", format: "email" },
              username: { type: "string" },
              isAdmin: { type: "boolean" },
            },
          },
          {
            id: "6efbbf87-7b32-4ca2-b750-4de9be29d186",
            email: "admin@example.com",
            username: "admin",
            isAdmin: true,
          },
        ),
        401: errorResponse("Aucune session Supabase valide.", "Non authentifié"),
      },
    },
  },
  "/api/profile/avatar": {
    post: {
      operationId: "uploadProfileAvatar",
      tags: ["Compte"],
      summary: "Téléverser une photo de profil",
      description:
        "Envoie une image dans le champ multipart `file`. Formats acceptés : JPG, PNG et GIF. Taille maximale : 5 Mio. L’authentification fonctionne par cookie de session ou avec un JWT Supabase dans `Authorization: Bearer <token>`.",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        description: "Fichier image à utiliser comme avatar.",
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: {
                  type: "string",
                  format: "binary",
                  description: "Image JPG, PNG ou GIF de 5 Mio maximum.",
                },
              },
              required: ["file"],
            },
            example: { file: "(binary image file)" },
          },
        },
      },
      responses: {
        200: jsonResponse(
          "URL publique de l’avatar, avec un paramètre anti-cache.",
          {
            type: "object",
            properties: { url: { type: "string", format: "uri" } },
            required: ["url"],
          },
          { url: "https://project.supabase.co/storage/v1/object/public/Images/avatars/user-id/avatar.jpg?v=1750320000000" },
        ),
        400: errorResponse("Fichier absent, trop lourd ou dans un format refusé.", "Format non supporté. Utilise JPG, PNG ou GIF."),
        401: errorResponse("Cookie ou jeton Bearer absent/invalide.", "Non authentifié — reconnecte-toi puis réessaie"),
        500: errorResponse("Erreur de stockage ou de configuration.", "Storage : upload failed"),
      },
    },
  },
};

const adminPaths: OpenApiPaths = {
  "/api/admin/restaurants": {
    get: {
      operationId: "adminListRestaurants",
      tags: ["Administration"],
      summary: "Lister les restaurants pour l’administration",
      description:
        "Nécessite `app_metadata.role = \"admin\"`. Contrairement à la route publique, elle peut inclure les restaurants désactivés et retourne les lignes brutes de la base.",
      security: adminSecurity,
      parameters: [
        {
          in: "query",
          name: "page",
          description: "Numéro de la page à retourner.",
          example: 1,
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          in: "query",
          name: "limit",
          description: "Nombre de lignes par page, plafonné à 200.",
          example: 50,
          schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
        },
        {
          in: "query",
          name: "search",
          description: "Recherche partielle dans le nom ou l’adresse.",
          example: "Tokyo",
          schema: { type: "string" },
        },
        {
          in: "query",
          name: "cuisine",
          description: "Filtre insensible à la casse sur la cuisine.",
          example: "japanese",
          schema: { type: "string" },
        },
        {
          in: "query",
          name: "includeInactive",
          description: "Mettre à `true` pour inclure les restaurants désactivés.",
          example: true,
          schema: { type: "boolean", default: false },
        },
      ],
      responses: {
        200: jsonResponse(
          "Liste paginée des lignes de la base.",
          {
            type: "object",
            properties: {
              data: { type: "array", items: { $ref: "#/components/schemas/DatabaseRestaurant" } },
              meta: {
                type: "object",
                properties: {
                  total: { type: "integer" },
                  page: { type: "integer" },
                  limit: { type: "integer" },
                },
              },
            },
          },
          { data: [databaseRestaurantExample], meta: { total: 37, page: 1, limit: 50 } },
        ),
        401: errorResponse("L’utilisateur n’est pas connecté.", "Non authentifié"),
        403: errorResponse("Le compte connecté n’est pas administrateur.", "Accès réservé aux administrateurs"),
        500: errorResponse("Erreur lors de la lecture de la base.", "Database connection failed"),
      },
    },
    post: {
      operationId: "adminCreateRestaurant",
      tags: ["Administration"],
      summary: "Créer un restaurant",
      description:
        "Crée un restaurant actif. Seul `name` est obligatoire ; `city` vaut `Nantes` et `source` vaut `manual` lorsqu’ils sont omis.",
      security: adminSecurity,
      requestBody: {
        required: true,
        description: "Informations du nouveau restaurant.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RestaurantInput" },
            example: {
              name: "Tokyo Kitchen",
              rating: 4.6,
              cuisine: "japanese",
              address: "12 rue de Strasbourg",
              city: "Nantes",
              latitude: 47.2184,
              longitude: -1.5536,
              website: "https://tokyo-kitchen.example",
              phone: "+33240123456",
            },
          },
        },
      },
      responses: {
        201: jsonResponse(
          "Ligne nouvellement créée.",
          { $ref: "#/components/schemas/DatabaseRestaurant" },
          databaseRestaurantExample,
        ),
        400: errorResponse("Le nom obligatoire est absent.", "Le nom est requis"),
        401: errorResponse("L’utilisateur n’est pas connecté.", "Non authentifié"),
        403: errorResponse("Le compte connecté n’est pas administrateur.", "Accès réservé aux administrateurs"),
        500: errorResponse("Erreur lors de l’insertion.", "Database insert failed"),
      },
    },
  },
  "/api/admin/restaurants/{id}": {
    get: {
      operationId: "adminGetRestaurant",
      tags: ["Administration"],
      summary: "Consulter un restaurant actif ou désactivé",
      description:
        "Retourne la ligne brute correspondant à l’identifiant, sans filtrer sur `is_active`. Cette route permet donc d’inspecter un restaurant masqué de l’API publique.",
      security: adminSecurity,
      parameters: [idParameter],
      responses: {
        200: jsonResponse(
          "Ligne complète de la base.",
          { $ref: "#/components/schemas/DatabaseRestaurant" },
          databaseRestaurantExample,
        ),
        400: errorResponse("L’identifiant n’est pas numérique.", "Identifiant invalide"),
        401: errorResponse("L’utilisateur n’est pas connecté.", "Non authentifié"),
        403: errorResponse("Le compte connecté n’est pas administrateur.", "Accès réservé aux administrateurs"),
        404: errorResponse("Aucune ligne ne correspond à cet identifiant.", "Restaurant introuvable"),
        500: errorResponse("Erreur lors de la lecture.", "Database connection failed"),
      },
    },
    put: {
      operationId: "adminUpdateRestaurant",
      tags: ["Administration"],
      summary: "Modifier les informations d’un restaurant",
      description:
        "Met à jour uniquement les champs éditables présents dans le JSON. Les champs système comme `id`, `is_active`, `created_at` et `updated_at` sont ignorés.",
      security: adminSecurity,
      parameters: [idParameter],
      requestBody: {
        required: true,
        description: "Champs à modifier. Il est possible de n’envoyer qu’un sous-ensemble.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RestaurantInput" },
            example: {
              name: "Tokyo Kitchen Nantes",
              rating: 4.8,
              website: "https://tokyo-kitchen-nantes.example",
            },
          },
        },
      },
      responses: {
        200: jsonResponse(
          "Ligne après modification.",
          { $ref: "#/components/schemas/DatabaseRestaurant" },
          {
            ...databaseRestaurantExample,
            name: "Tokyo Kitchen Nantes",
            rating: 4.8,
            website: "https://tokyo-kitchen-nantes.example",
          },
        ),
        400: errorResponse("L’identifiant n’est pas numérique.", "Identifiant invalide"),
        401: errorResponse("L’utilisateur n’est pas connecté.", "Non authentifié"),
        403: errorResponse("Le compte connecté n’est pas administrateur.", "Accès réservé aux administrateurs"),
        500: errorResponse("Erreur lors de la modification.", "Database update failed"),
      },
    },
  },
  "/api/admin/restaurants/{id}/activate": {
    patch: {
      operationId: "adminActivateRestaurant",
      tags: ["Administration"],
      summary: "Rendre un restaurant visible publiquement",
      description:
        "Passe `is_active` à `true`. Le restaurant réapparaît alors dans les routes publiques, les statistiques et le contexte de l’assistant.",
      security: adminSecurity,
      parameters: [idParameter],
      responses: {
        200: jsonResponse(
          "Restaurant activé.",
          { $ref: "#/components/schemas/DatabaseRestaurant" },
          { ...databaseRestaurantExample, is_active: true },
        ),
        400: errorResponse("L’identifiant n’est pas numérique.", "Identifiant invalide"),
        401: errorResponse("L’utilisateur n’est pas connecté.", "Non authentifié"),
        403: errorResponse("Le compte connecté n’est pas administrateur.", "Accès réservé aux administrateurs"),
        500: errorResponse("Erreur lors de l’activation.", "Database update failed"),
      },
    },
  },
  "/api/admin/restaurants/{id}/deactivate": {
    patch: {
      operationId: "adminDeactivateRestaurant",
      tags: ["Administration"],
      summary: "Masquer un restaurant des routes publiques",
      description:
        "Passe `is_active` à `false` sans supprimer la ligne. Le restaurant reste accessible dans l’administration avec `includeInactive=true`.",
      security: adminSecurity,
      parameters: [idParameter],
      responses: {
        200: jsonResponse(
          "Restaurant désactivé.",
          { $ref: "#/components/schemas/DatabaseRestaurant" },
          { ...databaseRestaurantExample, is_active: false },
        ),
        400: errorResponse("L’identifiant n’est pas numérique.", "Identifiant invalide"),
        401: errorResponse("L’utilisateur n’est pas connecté.", "Non authentifié"),
        403: errorResponse("Le compte connecté n’est pas administrateur.", "Accès réservé aux administrateurs"),
        500: errorResponse("Erreur lors de la désactivation.", "Database update failed"),
      },
    },
  },
  "/api/admin/restaurants/export/csv": {
    get: {
      operationId: "adminExportRestaurantsCsv",
      tags: ["Administration"],
      summary: "Télécharger les restaurants actifs au format CSV",
      description:
        "Produit un fichier CSV destiné à l’export. Seuls les restaurants actifs sont inclus. Le navigateur télécharge le fichier sous le nom `restaurants_nantes.csv`.",
      security: adminSecurity,
      parameters: [
        {
          in: "query",
          name: "excludeFrench",
          description: "Mettre à `true` pour retirer les restaurants identifiés comme français.",
          example: false,
          schema: { type: "boolean", default: false },
        },
      ],
      responses: {
        200: {
          description: "Fichier CSV encodé en UTF-8.",
          content: {
            "text/csv": {
              schema: { type: "string" },
              example:
                '"nom","typedecuisine","adresse","ville","lien_google_maps","phone"\n"Tokyo Kitchen","Japon","12 rue de Strasbourg","Nantes","https://www.google.com/maps?q=47.2184,-1.5536","+33240123456"',
            },
          },
        },
        401: errorResponse("L’utilisateur n’est pas connecté.", "Non authentifié"),
        403: errorResponse("Le compte connecté n’est pas administrateur.", "Accès réservé aux administrateurs"),
        500: errorResponse("Erreur lors de la génération.", "Database connection failed"),
      },
    },
  },
};

export function createSwaggerSpec(includeAdmin: boolean) {
  return {
    openapi: "3.0.0",
    info: {
      title: "Cuisine du Monde API",
      version: "1.2.0",
      description:
        "API de découverte de restaurants à Nantes.\n\n**Utilisation :** ouvrez une route, cliquez sur **Try it out**, modifiez les valeurs d’exemple puis cliquez sur **Execute**.\n\n**Authentification :** les routes publiques fonctionnent immédiatement. Pour les routes marquées par un cadenas, connectez-vous d’abord dans l’application avec le même navigateur. Les routes Administration nécessitent en plus `app_metadata.role = \"admin\"` dans Supabase.",
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        description: "Serveur de l’application courante",
      },
    ],
    tags: [
      {
        name: "Restaurants",
        description: "Consultation publique, recherche, statistiques et notation.",
      },
      {
        name: "Assistant",
        description: "Assistant IA utilisant les restaurants actifs comme contexte.",
      },
      {
        name: "Compte",
        description: "Session Supabase et photo de profil.",
      },
      ...(includeAdmin
        ? [{
            name: "Administration",
            description:
              "Gestion complète des restaurants. Ces routes exigent une session dont `app_metadata.role` vaut `admin`.",
          }]
        : []),
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "Supabase session cookies",
          description:
            "La session est automatiquement envoyée si vous êtes connecté dans l’application avec ce navigateur.",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "Supabase JWT",
          description: "Jeton d’accès Supabase, accepté uniquement par les routes qui le mentionnent.",
        },
      },
      schemas: {
        Restaurant: publicRestaurantSchema,
        DatabaseRestaurant: databaseRestaurantSchema,
        RestaurantInput: restaurantInputSchema,
        Error: errorSchema,
        Pagination: {
          type: "object",
          properties: {
            total: { type: "integer", description: "Nombre total de résultats." },
            page: { type: "integer", description: "Page courante." },
            limit: { type: "integer", description: "Taille demandée de la page." },
            totalPages: { type: "integer", description: "Nombre total de pages." },
          },
          required: ["total", "page", "limit", "totalPages"],
        },
      },
    },
    paths: {
      ...publicPaths,
      ...(includeAdmin ? adminPaths : {}),
    },
  };
}

export const swaggerSpec = createSwaggerSpec(false);
