# Ethiopian Maids Platform — Monorepo

A full-stack platform connecting Ethiopian domestic workers with families and agencies across the Middle East and beyond.

## Architecture

```
ethiopian-maids-monorepo/
├── apps/
│   ├── web/                    # React 18 + Vite SPA (main web app)
│   └── mobile/                 # Expo React Native app
├── packages/
│   ├── api-client/             # Apollo Client + GraphQL codegen
│   ├── domain/                 # Domain models (identity, profiles, jobs, payments)
│   ├── app/                    # Application use-cases per domain
│   └── infra/                  # Infrastructure adapters (web, mobile)
├── tools/
│   └── firebase-functions/     # Firebase Cloud Functions (TypeScript)
├── .github/workflows/          # CI/CD pipelines
├── docker-compose.yml          # Local development stack
└── ecosystem.config.js         # PM2 VPS deployment config
```

**Stack:** React 18 · Vite · TypeScript · Firebase Auth · Firestore · Hasura GraphQL · PostgreSQL · Stripe · Nx Monorepo · pnpm

## Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm@9`)
- Docker & Docker Compose (for local stack)
- Firebase CLI (`npm install -g firebase-tools`)
- Nx CLI (`npm install -g nx`)

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/umero882/ethiopian-maids-monorepo.git
cd ethiopian-maids-monorepo
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your Firebase, Hasura, and Stripe credentials
```

### 3. Start local services

```bash
# Start Postgres + Hasura + Firebase Emulator
docker-compose up -d

# Start web app dev server
pnpm nx dev web
```

The web app will be available at `http://localhost:5173`.
Hasura Console: `http://localhost:8080`
Firebase Emulator UI: `http://localhost:4000`

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_HASURA_GRAPHQL_ENDPOINT` | Hasura GraphQL HTTP endpoint |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_live_*` in production) |
| `VITE_SENTRY_DSN` | Sentry DSN for error monitoring (optional) |
| `VPS_HOST` | VPS IP for deployment |

## Running Tests

```bash
# Run all tests
pnpm nx run-many --target=test --all

# Run web app tests with coverage
pnpm nx test:coverage web

# Run specific package tests
pnpm nx test api-client
```

## Building

```bash
# Build web app for production
pnpm nx build web --configuration=production

# Build Firebase Functions
pnpm nx build firebase-functions
```

## Deployment

### Docker (recommended)

```bash
docker build -f apps/web/Dockerfile \
  --build-arg VITE_FIREBASE_API_KEY=... \
  --build-arg VITE_STRIPE_PUBLISHABLE_KEY=... \
  -t ethiopian-maids-web .
docker run -p 80:80 ethiopian-maids-web
```

### VPS with PM2

```bash
# On the VPS
pnpm install
pnpm nx build web --configuration=production
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Firebase Functions

```bash
cd tools/firebase-functions
firebase deploy --only functions
```

### CI/CD

GitHub Actions automatically:
- **Lint** -> **Test** -> **Build** on every push/PR to `main` or `develop`
- **Deploy** to VPS on push to `main` (requires `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` secrets)

Required GitHub Secrets: `VITE_FIREBASE_*`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_HASURA_ENDPOINT`, `VITE_SENTRY_DSN`, `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `CODECOV_TOKEN`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes following the code style
4. Run tests: `pnpm nx run-many --target=test --all`
5. Run lint: `pnpm nx run-many --target=lint --all`
6. Commit using conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
7. Open a Pull Request against `develop`

### Code Standards

- TypeScript strict mode for all new code
- 70% minimum test coverage (lines/functions/statements), 60% branches
- ESLint + Prettier enforced via CI
- All Firebase Functions must have error handling and logging

## License

Private — All rights reserved.
