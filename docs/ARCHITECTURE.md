# AdminDashboard - Architecture Technique

## Vue d'ensemble

AdminDashboard est une application web auto-hébergée conçue comme un cockpit personnel pour administrateurs système/réseau. Elle centralise la gestion de scripts, registres Windows, configurations Zabbix, notes, procédures, tâches et flux RSS.

## Architecture Générale

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DOCKER NETWORK                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────────┐  │
│  │   NGINX      │    │    FRONTEND      │    │      BACKEND         │  │
│  │   Reverse    │───▶│    React/TS      │    │    Node.js/Express   │  │
│  │   Proxy      │    │    Port: 3000    │    │    Port: 4000        │  │
│  │   Port: 80   │    └──────────────────┘    └──────────┬───────────┘  │
│  │   /443       │                                       │              │
│  └──────┬───────┘                                       │              │
│         │                                               │              │
│         │              ┌────────────────────────────────┘              │
│         │              │                                               │
│         │              ▼                                               │
│         │    ┌──────────────────┐    ┌──────────────────────┐         │
│         │    │   PostgreSQL     │    │       Redis          │         │
│         │    │   Database       │    │    Cache/Sessions    │         │
│         └───▶│   Port: 5432     │    │    Port: 6379        │         │
│              └──────────────────┘    └──────────────────────┘         │
│                                                                        │
│              ┌──────────────────┐                                      │
│              │   (Future) LLM   │                                      │
│              │   Ollama/LocalAI │                                      │
│              │   Port: 11434    │                                      │
│              └──────────────────┘                                      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

## Stack Technique

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js avec TypeScript
- **ORM**: Prisma (type-safe, migrations automatiques)
- **Validation**: Zod (schémas de validation)
- **Auth**: JWT avec refresh tokens
- **Documentation API**: OpenAPI/Swagger

### Frontend
- **Framework**: React 18 avec TypeScript
- **State Management**: Zustand (léger, simple)
- **Routing**: React Router v6
- **UI Components**: Tailwind CSS + Headless UI
- **HTTP Client**: Axios avec interceptors
- **Forms**: React Hook Form + Zod

### Base de données
- **SGBD**: PostgreSQL 16
- **Cache**: Redis 7
- **Migrations**: Prisma Migrate

### Infrastructure
- **Containerisation**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Volumes**: Persistance des données

## Architecture Modulaire

### Principe de Conception

Chaque module métier est isolé et suit une structure identique :

```
modules/
├── scripts/
│   ├── scripts.controller.ts    # Routes HTTP
│   ├── scripts.service.ts       # Logique métier
│   ├── scripts.schema.ts        # Validation Zod
│   └── scripts.types.ts         # Types TypeScript
├── registries/
├── zabbix/
├── notes/
├── procedures/
├── todos/
├── favorites/
└── rss/
```

### Modules Disponibles

| Module | Description | Table DB |
|--------|-------------|----------|
| Scripts | Gestion de scripts (PowerShell, Bash, etc.) | `scripts` |
| Registries | Entrées de registre Windows | `registry_entries` |
| Zabbix | Éléments, triggers, templates Zabbix | `zabbix_items` |
| Notes | Notes simples ou Markdown | `notes` |
| Procedures | Documentation pas à pas | `procedures` |
| Todos | Gestion de tâches multi-projets | `todos` |
| Favorites | Liens favoris (internes/externes) | `favorites` |
| RSS | Flux RSS pour la veille | `rss_feeds`, `rss_items` |

## Système d'Authentification

### Flow JWT

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │  Backend │     │   Redis  │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     │  POST /login   │                │
     ├───────────────▶│                │
     │                │                │
     │                │ Store refresh  │
     │                ├───────────────▶│
     │                │                │
     │  Access Token  │                │
     │  + Refresh     │                │
     │◀───────────────┤                │
     │                │                │
     │  API Request   │                │
     │  + Bearer      │                │
     ├───────────────▶│                │
     │                │                │
     │  Response      │                │
     │◀───────────────┤                │
```

### Rôles et Permissions (RBAC)

| Rôle | Description | Permissions |
|------|-------------|-------------|
| `admin` | Administrateur complet | Toutes les permissions |
| `user` | Utilisateur standard | CRUD sur ses données |
| `readonly` | Lecture seule | Lecture uniquement |

### Permissions par Module

```typescript
{
  scripts: ['create', 'read', 'update', 'delete', 'execute'],
  registries: ['create', 'read', 'update', 'delete', 'export'],
  zabbix: ['create', 'read', 'update', 'delete', 'sync'],
  notes: ['create', 'read', 'update', 'delete'],
  procedures: ['create', 'read', 'update', 'delete'],
  todos: ['create', 'read', 'update', 'delete'],
  favorites: ['create', 'read', 'update', 'delete'],
  rss: ['create', 'read', 'update', 'delete', 'refresh']
}
```

## Recherche Globale

### Architecture de Recherche

```
┌─────────────────────────────────────────────────────────────┐
│                    Search Service                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Query: "backup script"                                     │
│                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  Scripts    │  │   Notes     │  │ Procedures  │  ...   │
│   │  Adapter    │  │  Adapter    │  │  Adapter    │        │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│          │                │                │                │
│          ▼                ▼                ▼                │
│   ┌─────────────────────────────────────────────────────┐  │
│   │              PostgreSQL Full-Text Search             │  │
│   │                    (tsvector, tsquery)               │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                              │
│   Results: [                                                │
│     { type: 'script', title: 'Backup Database', ... },     │
│     { type: 'procedure', title: 'Backup Guide', ... }      │
│   ]                                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Index de Recherche

Chaque module expose une interface `Searchable` :

```typescript
interface SearchableItem {
  id: string;
  type: ModuleType;
  title: string;
  content: string;
  tags: string[];
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}
```

## API Design

### Conventions REST

- `GET /api/v1/{module}` - Liste paginée
- `GET /api/v1/{module}/:id` - Détail
- `POST /api/v1/{module}` - Création
- `PUT /api/v1/{module}/:id` - Mise à jour complète
- `PATCH /api/v1/{module}/:id` - Mise à jour partielle
- `DELETE /api/v1/{module}/:id` - Suppression

### Pagination Standard

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Gestion des Erreurs

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "title", "message": "Required" }
    ]
  }
}
```

## Sécurité

### Mesures Implémentées

1. **Authentification**
   - JWT avec expiration courte (15 min)
   - Refresh tokens en Redis (7 jours)
   - Rotation des tokens

2. **Protection des Routes**
   - Middleware d'authentification
   - Vérification des permissions RBAC
   - Rate limiting par IP

3. **Validation des Données**
   - Schémas Zod stricts
   - Sanitization des inputs
   - Protection CSRF

4. **Headers de Sécurité**
   - Helmet.js configuré
   - CORS restrictif
   - Content Security Policy

5. **Base de Données**
   - Requêtes paramétrées (Prisma)
   - Chiffrement des mots de passe (bcrypt)
   - Isolation des données par utilisateur

## Évolutivité

### Ajout d'un Nouveau Module

1. Créer le dossier `modules/{newModule}/`
2. Implémenter les fichiers standard (controller, service, schema)
3. Ajouter le modèle Prisma
4. Enregistrer les routes dans `app.ts`
5. Créer les composants frontend correspondants

### Intégration LLM Future

L'architecture prévoit un conteneur pour un LLM local :

```yaml
llm:
  image: ollama/ollama:latest
  ports:
    - "11434:11434"
  volumes:
    - ollama_data:/root/.ollama
```

Le backend exposera un service d'abstraction :

```typescript
interface LLMService {
  complete(prompt: string): Promise<string>;
  embed(text: string): Promise<number[]>;
  summarize(content: string): Promise<string>;
}
```

## Performance

### Stratégies de Cache

1. **Redis** : Sessions, tokens, résultats de recherche fréquents
2. **HTTP Cache** : Headers Cache-Control pour assets statiques
3. **Database** : Index PostgreSQL optimisés

### Optimisations

- Lazy loading des modules frontend
- Pagination côté serveur
- Debounce sur la recherche
- Compression gzip/brotli (Nginx)

## Monitoring (Future)

- Prometheus + Grafana pour les métriques
- Logs structurés (JSON) avec Winston
- Health checks pour Docker

---

*Document généré pour AdminDashboard v1.0*
