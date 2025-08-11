# Organizational Health Dashboard (Boilerplate)

Monorepo with:

- **API**: NestJS-style TypeScript, REST, TypeORM (MySQL), Swagger, Jest unit + e2e, seed framework
- **Web**: React + Vite + Ant Design, Jest/RTL smoke test
- **Infra**: Docker Compose (MySQL)

## Quick start

```bash
pnpm install

# Copy env for API
cp apps/api/.env.example apps/api/.env
cp apps/api/.env.example apps/api/.env.development
cp apps/api/.env.test.example apps/api/.env.test

# Start MySQL via Docker Compose
pnpm -C apps/api db:up

# Start API & Web
pnpm dev

# Start API & Web (split-pane TUI with ↑ / ↓ to switch tasks)
pnpm dev:tui

# Start API only
pnpm -C apps/api dev

# Start Web only
pnpm -C apps/web dev

# API Example
curl http://127.0.0.1:3000/api/organizations
```

Swagger: [http://127.0.0.1:3000/docs](http://127.0.0.1:3000/docs)\
Web: [http://localhost:5173](http://localhost:5173)

---

## Environment Variables

| Variable     | Purpose           | Example                                |
| ------------ | ----------------- | -------------------------------------- |
| DB\_HOST     | MySQL host        | 127.0.0.1                              |
| DB\_PORT     | MySQL port        | 3307                                   |
| DB\_USER     | DB username       | root                                   |
| DB\_PASSWORD | DB password       | password                               |
| DB\_NAME     | Dev database name | tali\_talent\_org\_health\_development |

---

## Top-Level Monorepo Commands

```bash
pnpm dev         # Start all apps in parallel (API + Web) using Turbo
pnpm build       # Build all apps and packages
pnpm test        # Run all unit tests across the monorepo
pnpm test:e2e    # Run all e2e tests across the monorepo
pnpm test:all    # Run unit + e2e tests across the monorepo
pnpm lint        # Lint all packages
pnpm lint:fix    # Lint and fix all packages
pnpm format      # Check formatting
pnpm format:fix  # Format all packages
```

---

## Per-App Test Commands

### API

```bash
pnpm -C apps/api test     # Run API unit tests
pnpm -C apps/api test:e2e # Run API e2e tests
```

### Web

```bash
pnpm -C apps/web test     # Run Web unit tests
pnpm -C apps/web test:ui  # Run Web unit tests in interactive mode
```

---

## Database Management Scripts

From the project root:

```bash
pnpm -C apps/api db:up             # Start DB container
pnpm -C apps/api db:down           # Stop DB container
pnpm -C apps/api db:reset          # Recreate DB container from scratch
pnpm -C apps/api db:shell          # Log into DB container
pnpm -C apps/api db:logs           # View DB container logs
pnpm -C apps/api db:ps             # Show DB container status
pnpm -C apps/api db:mysql:verify   # List org health databases in container
pnpm -C apps/api db:ready          # Wait until DB is ready (for scripts/CI)

pnpm -C apps/api db:migration:generate <Name>   # Generate a migration
pnpm -C apps/api db:migration:create <Name>     # Create an empty migration
pnpm -C apps/api db:migration:run               # Run migrations
pnpm -C apps/api db:migration:revert            # Revert last migration
pnpm -C apps/api db:schema:drop                 # Drop DB schema
pnpm -C apps/api db:show                        # Show migrations
```

These commands are configured in `package.json` and use `apps/api/docker/mysql/docker-compose.yml`. The DB init scripts automatically create both the development and test databases when starting fresh.

---

## Seeding the Database

From the project root:

```bash
pnpm -C apps/api db:seed        # Run all seeders (idempotent)
pnpm -C apps/api db:seed:clear  # Clear all seeded data
```

### How Seeding Works

- **Seed services** are automatically discovered in `src/**/seeds/**/*seed.service.ts`.
- Each seed service can implement:
  - `async run()` — inserts data (should be idempotent)
  - `async clear()` — removes data inserted by the seed
- Example: `OrganizationSeedService` inserts demo organizations using [`@faker-js/faker`](https://github.com/faker-js/faker).
- `fast-glob` is used to dynamically load both seeders and entities, so new seed files are picked up automatically.

---

## Code Generation

This project uses [Hygen](http://www.hygen.io/) to quickly scaffold API resources (entities, controllers, services, modules, DTOs, and seeds) following the plural-folder + UUID conventions.

From the project root:

```bash
pnpm -C apps/api gen:entity Organization       # Entity (plural folder)
pnpm -C apps/api gen:service Organization      # Service (UUID-based lookups)
pnpm -C apps/api gen:controller Organization   # Controller (UUID + ParseUUIDPipe)
pnpm -C apps/api gen:module Organization       # Module (imports TypeOrmModule.forFeature([...]))
pnpm -C apps/api gen:dto Organization          # DTOs (CreateXxxDto / UpdateXxxDto)
pnpm -C apps/api gen:seed Organization         # Seed service (dynamic seed framework)
```

---

## Linting / Formatting

From the project root:

```bash
pnpm lint                             # Run lint across all packages
pnpm lint:fix                         # Run lint with auto-fix across all packages
pnpm format                           # Check code formatting across all packages
pnpm format:fix                       # Format code across all packages

pnpm -C apps/api lint                 # Lint API service
pnpm -C apps/api lint:fix             # Lint API service and auto-fix issues
pnpm -C apps/api format               # Check formatting in API service
pnpm -C apps/api format:fix           # Format code in API service

pnpm -C apps/web lint                 # Lint Web app
pnpm -C apps/web lint:fix             # Lint Web app and auto-fix issues
pnpm -C apps/web format               # Check formatting in Web app
pnpm -C apps/web format:fix           # Format code in Web app
```

