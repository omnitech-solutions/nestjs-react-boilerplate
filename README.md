# Organizational Health Dashboard (Boilerplate)

Monorepo with:

- **API**: NestJS-style TypeScript, REST, TypeORM (MySQL), Swagger, Jest unit + e2e
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

# Start API
pnpm -C apps/api dev

# Start Web
pnpm -C apps/web dev

# API Example
curl http://127.0.0.1:3000/api/organizations
```

Swagger: [http://127.0.0.1:3000/docs](http://127.0.0.1:3000/docs)\
Web: [http://localhost:5173](http://localhost:5173)

## Tests

```bash
pnpm -C apps/api test
pnpm -C apps/api test:e2e
pnpm -C apps/web test
```

## Database Management Scripts

From the project root:

```bash
pnpm -C apps/api db:up       # Start DB container
pnpm -C apps/api db:down     # Stop DB container
pnpm -C apps/api db:reset    # Recreate DB container from scratch
pnpm -C apps/api db:shell    # Log into DB container
pnpm -C apps/api db:mysql:verify   # List org health databases in container
```

These commands are configured in `package.json` and use `apps/api/docker/mysql/docker-compose.yml`. The DB init scripts automatically create both the development and test databases when starting fresh.

