# Organizational Health Dashboard (Boilerplate)

Monorepo with:
- **API**: NestJS-style TypeScript, REST, TypeORM (MySQL), Swagger, Jest unit + e2e
- **Web**: React + Vite + Ant Design, Jest/RTL smoke test
- **Infra**: Docker Compose (MySQL)

## Quick start

```bash
pnpm install
# copy env for API
cp apps/api/.env.example apps/api/.env
docker compose up -d db
pnpm -C apps/api dev
pnpm -C apps/web dev
```

Swagger: http://localhost:3000/docs  
Web: http://localhost:5173

## Tests
```bash
pnpm -C apps/api test
pnpm -C apps/api test:e2e
pnpm -C apps/web test
```
