# AdminDashboard

Personal productivity cockpit for system administrators and network engineers. A self-hosted, modular web application to centralize scripts, registry entries, Zabbix configurations, notes, procedures, tasks, favorites, and RSS feeds.

## Features

- **Unified Search** - Search across all modules from a single search bar
- **Scripts Management** - Store and organize PowerShell, Bash, Python scripts with syntax highlighting
- **Windows Registry** - Manage registry entries and export to `.reg` files
- **Zabbix Integration** - Store templates, triggers, items with future API sync support
- **Notes** - Markdown-supported notes with linking capabilities
- **Procedures** - Step-by-step documentation with versioning
- **Todo Lists** - Multi-project task management with priorities
- **Favorites** - Quick access dashboard with internal/external links
- **RSS Reader** - Technical news and security feed aggregation
- **Authentication** - JWT-based auth with role-based access control (RBAC)

## Tech Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js + TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Validation**: Zod

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Routing**: React Router v6
- **Forms**: React Hook Form

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Future**: Ollama/LocalAI integration

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd admin-dashboard
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Generate secrets**
```bash
# Generate JWT secrets
openssl rand -base64 64
# Add to .env as JWT_ACCESS_SECRET and JWT_REFRESH_SECRET
```

4. **Start the application**
```bash
docker-compose up -d
```

5. **Access the application**
- Frontend: http://localhost
- API: http://localhost/api/v1
- Health: http://localhost/health

### Default Credentials
- Email: `admin@localhost`
- Password: `ChangeMe123!`

> **Important**: Change the default password immediately after first login!

## Development

### Backend Development
```bash
cd backend
cp .env.example .env
npm install
npm run db:generate
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Database Migrations
```bash
cd backend
npm run db:migrate    # Development
npm run db:migrate:prod  # Production
npm run db:studio     # Prisma Studio GUI
```

## Project Structure

```
admin-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── middleware/      # Express middleware
│   │   ├── modules/         # Feature modules
│   │   │   ├── auth/
│   │   │   ├── scripts/
│   │   │   ├── registries/
│   │   │   ├── zabbix/
│   │   │   ├── notes/
│   │   │   ├── procedures/
│   │   │   ├── todos/
│   │   │   ├── favorites/
│   │   │   ├── rss/
│   │   │   ├── search/
│   │   │   ├── categories/
│   │   │   └── tags/
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utilities
│   └── prisma/              # Database schema
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── store/           # Zustand stores
│   │   └── types/           # TypeScript types
│   └── public/              # Static assets
├── nginx/                   # Nginx configuration
├── scripts/                 # Utility scripts
├── docs/                    # Documentation
├── docker-compose.yml
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Modules (CRUD)
- `/api/v1/scripts` - Scripts management
- `/api/v1/registries` - Registry entries
- `/api/v1/zabbix` - Zabbix items
- `/api/v1/notes` - Notes
- `/api/v1/procedures` - Procedures
- `/api/v1/todos` - Todo lists & projects
- `/api/v1/favorites` - Favorites
- `/api/v1/rss` - RSS feeds & items

### Global
- `/api/v1/search` - Global search
- `/api/v1/categories` - Categories
- `/api/v1/tags` - Tags

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DOMAIN` | Your domain | `localhost` |
| `DB_PASSWORD` | PostgreSQL password | - |
| `JWT_ACCESS_SECRET` | Access token secret | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `ADMIN_EMAIL` | Admin email | `admin@localhost` |
| `ADMIN_PASSWORD` | Admin password | `ChangeMe123!` |

### SSL/TLS Setup

For production with HTTPS, uncomment and configure the SSL server block in `nginx/conf.d/default.conf`.

## Security

- JWT tokens with short-lived access tokens (15 min)
- Refresh tokens stored in Redis
- Password hashing with bcrypt (12 rounds)
- Rate limiting on API endpoints
- CORS protection
- Helmet.js security headers
- Input validation with Zod
- SQL injection prevention (Prisma)

## Backup

### Database Backup
```bash
docker exec admindash-postgres pg_dump -U admindash admindash > backup.sql
```

### Restore
```bash
docker exec -i admindash-postgres psql -U admindash admindash < backup.sql
```

## Roadmap

- [ ] LLM integration (Ollama/LocalAI)
- [ ] Zabbix API synchronization
- [ ] Remote script execution
- [ ] Workflow automation
- [ ] Import/Export functionality
- [ ] Mobile responsive improvements
- [ ] Dark/Light theme toggle
- [ ] Audit logging
- [ ] Prometheus metrics

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## License

MIT License - See LICENSE file for details.

---

Built with care for sysadmins, by sysadmins.
