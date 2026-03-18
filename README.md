# 🍽️ Cuisine du Monde - Nantes

Application web de consultation et d'administration des restaurants du monde à Nantes. Refonte full-stack selon le cahier des charges : **Next.js** + **NestJS** + **PostgreSQL** + **Docker Compose**.

## 🚀 Démarrage rapide (Docker)

**Prérequis :** Docker et Docker Compose installés.

```bash
# Cloner et lancer
git clone <repo>
cd Cuisine_du_Monde_-_Nantes

# Démarrer tous les services
docker compose up -d

# Appliquer les migrations et créer l'admin (première fois)
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

- **Frontend :** http://localhost:3000  
- **API / Swagger :** http://localhost:3001/docs  
- **Compte admin :** admin@cuisine-du-monde.local / admin123  

## 📁 Structure du projet

```
├── frontend/          # Next.js - Interface publique + back-office
├── backend/           # NestJS - API REST, auth, sync OSM
├── docker-compose.yml
└── README.md
```

## 🛠️ Développement local (sans Docker)

> **Windows PowerShell :** `&&` n'est pas supporté. Exécutez les commandes une par une, ou utilisez `npm run backend:dev` et `npm run frontend:dev` depuis la racine.

### Backend

```bash
cd backend
npm install
cp .env.example .env   # ou copy sur Windows
# Configurer DATABASE_URL (PostgreSQL local)
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

API : http://localhost:3001 | Swagger : http://localhost:3001/docs

### Frontend (dans un autre terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend : http://localhost:3000

## 📡 API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/v1/restaurants | Liste avec filtres (cuisine, search, pagination) |
| GET | /api/v1/restaurants/stats | Statistiques |
| GET | /api/v1/restaurants/cuisines | Types de cuisines |
| GET | /api/v1/restaurants/:id | Détail restaurant |
| POST | /api/v1/auth/login | Connexion admin |
| POST | /api/v1/sync/osm | Sync OpenStreetMap (admin) |
| GET | /api/v1/admin/restaurants/export/csv | Export CSV (admin) |

Documentation complète : http://localhost:3001/docs

## 🔐 Sécurité

- Authentification admin : JWT
- Mots de passe hashés (bcrypt)
- Variables sensibles dans `.env` (ne pas committer)

## 📄 Licence

MIT
