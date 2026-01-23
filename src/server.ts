/**
 * Serveur HTTP avec Bun pour l'API des restaurants
 * Déployable sur Railway
 */

import { Database } from "bun:sqlite";
import { OSMRestaurantFetcher } from "./fetcher";

const PORT = process.env.PORT || 3000;
const db = new Database("restaurants_nantes_osm.db");

// Initialiser la base de données
db.exec(`
  CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cuisine TEXT,
    address TEXT,
    city TEXT DEFAULT 'Nantes',
    latitude REAL,
    longitude REAL,
    osm_id TEXT,
    osm_type TEXT,
    website TEXT,
    phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Gérer OPTIONS pour CORS
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    try {
      // Route: GET /api/restaurants
      if (path === "/api/restaurants" && req.method === "GET") {
        const cuisine = url.searchParams.get("cuisine");
        const limit = parseInt(url.searchParams.get("limit") || "100");

        let query = "SELECT * FROM restaurants WHERE 1=1";
        const params: any[] = [];

        if (cuisine) {
          query += " AND cuisine = ?";
          params.push(cuisine);
        }

        query += " ORDER BY created_at DESC LIMIT ?";
        params.push(limit);

        const restaurants = db.prepare(query).all(...params);

        return Response.json(
          {
            success: true,
            count: restaurants.length,
            data: restaurants,
          },
          { headers }
        );
      }

      // Route: GET /api/restaurants/stats
      if (path === "/api/restaurants/stats" && req.method === "GET") {
        const total = db.prepare("SELECT COUNT(*) as count FROM restaurants").get() as any;
        const byCuisine = db
          .prepare(
            "SELECT cuisine, COUNT(*) as count FROM restaurants WHERE cuisine IS NOT NULL GROUP BY cuisine ORDER BY count DESC"
          )
          .all();

        return Response.json(
          {
            success: true,
            stats: {
              total: total.count,
              byCuisine: byCuisine,
            },
          },
          { headers }
        );
      }

      // Route: POST /api/restaurants/fetch
      if (path === "/api/restaurants/fetch" && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const cuisineFilter = body.cuisine || null;

        const fetcher = new OSMRestaurantFetcher();
        const restaurants = await fetcher.fetchRestaurantsNantes(cuisineFilter);

        // Sauvegarder dans la base de données
        let saved = 0;
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO restaurants 
          (name, cuisine, address, city, latitude, longitude, osm_id, osm_type, website, phone)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const restaurant of restaurants) {
          try {
            stmt.run(
              restaurant.name,
              restaurant.cuisine,
              restaurant.address,
              restaurant.city,
              restaurant.latitude,
              restaurant.longitude,
              restaurant.osm_id,
              restaurant.osm_type,
              restaurant.website,
              restaurant.phone
            );
            saved++;
          } catch (e) {
            console.error("Erreur sauvegarde:", e);
          }
        }

        return Response.json(
          {
            success: true,
            fetched: restaurants.length,
            saved: saved,
            message: `${saved} restaurants sauvegardés`,
          },
          { headers }
        );
      }

      // Route: GET /api/restaurants/export/csv
      if (path === "/api/restaurants/export/csv" && req.method === "GET") {
        const restaurants = db
          .prepare("SELECT * FROM restaurants ORDER BY name")
          .all() as any[];

        const fetcher = new OSMRestaurantFetcher();
        // Convertir les résultats de la BDD en format Restaurant
        const restaurantsFormatted = restaurants.map((r: any) => ({
          name: r.name || "",
          cuisine: r.cuisine,
          address: r.address,
          city: r.city || "Nantes",
          latitude: r.latitude,
          longitude: r.longitude,
          osm_id: r.osm_id,
          osm_type: r.osm_type,
          website: r.website,
          phone: r.phone,
        }));
        const csv = fetcher.exportToCSVString(restaurantsFormatted, true);

        return new Response(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="restaurants_nantes.csv"',
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      // Route: GET / (page d'accueil)
      if (path === "/" && req.method === "GET") {
        return new Response(getHomePage(), {
          headers: { "Content-Type": "text/html" },
        });
      }

      // 404
      return Response.json({ success: false, error: "Not found" }, { status: 404, headers });
    } catch (error) {
      console.error("Erreur:", error);
      return Response.json(
        { success: false, error: error instanceof Error ? error.message : "Internal server error" },
        { status: 500, headers }
      );
    }
  },
});

function getHomePage(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restaurants Nantes - API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
    }
    .endpoints {
      display: grid;
      gap: 20px;
      margin-top: 30px;
    }
    .endpoint {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      border-radius: 8px;
    }
    .method {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.9em;
      margin-right: 10px;
    }
    .get { background: #28a745; color: white; }
    .post { background: #007bff; color: white; }
    code {
      background: #e9ecef;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 10px;
      transition: background 0.3s;
    }
    .btn:hover { background: #5568d3; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🍽️ Restaurants Nantes API</h1>
    <p class="subtitle">API pour récupérer les restaurants à Nantes depuis OpenStreetMap</p>
    
    <div class="stats" id="stats">
      <div class="stat-card">
        <div class="stat-value">-</div>
        <div>Total restaurants</div>
      </div>
    </div>

    <div class="endpoints">
      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/restaurants</code>
        <p>Récupère tous les restaurants</p>
        <p><strong>Query params:</strong> <code>?cuisine=italian&limit=50</code></p>
        <a href="/api/restaurants" class="btn" target="_blank">Tester</a>
      </div>

      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/restaurants/stats</code>
        <p>Statistiques des restaurants</p>
        <a href="/api/restaurants/stats" class="btn" target="_blank">Tester</a>
      </div>

      <div class="endpoint">
        <span class="method post">POST</span>
        <code>/api/restaurants/fetch</code>
        <p>Récupère de nouveaux restaurants depuis OpenStreetMap</p>
        <p><strong>Body:</strong> <code>{"cuisine": "italian"}</code> (optionnel)</p>
      </div>

      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/restaurants/export/csv</code>
        <p>Exporte les restaurants en CSV</p>
        <a href="/api/restaurants/export/csv" class="btn" target="_blank">Télécharger CSV</a>
      </div>
    </div>
  </div>

  <script>
    fetch('/api/restaurants/stats')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          document.querySelector('.stat-value').textContent = data.stats.total;
        }
      })
      .catch(console.error);
  </script>
</body>
</html>`;
}

console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
console.log(`📊 API disponible sur http://localhost:${PORT}/api/restaurants`);
console.log(`🌐 Interface web sur http://localhost:${PORT}/`);
