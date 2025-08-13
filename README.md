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

## Linting / Formatting

From the project root:

```bash
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:fix
```

---

## Code Generation

This project uses [Hygen](http://www.hygen.io/) to quickly scaffold API resources (entities, controllers, services, modules, DTOs, and seeds) following the plural-folder + UUID conventions.

### Individual Generators

```bash
pnpm -C apps/api gen:entity <EntityName>
pnpm -C apps/api gen:service <EntityName>
pnpm -C apps/api gen:controller <EntityName>
pnpm -C apps/api gen:module <EntityName>
pnpm -C apps/api gen:dto <EntityName>
pnpm -C apps/api gen:seed <EntityName>
```

### Full Resource Generator

```bash
pnpm -C apps/api gen:all --name <EntityName> --fields "fieldName:string otherField:decimal{18,6}?"
```

> `gen:all` calls all the above generators in sequence. Both `--name` and `--fields` are required.

---

## API Folder Structure

```txt
apps/api/src/
├── <entity-names>/                       # e.g. insights
│   ├── <entity-name>.entity.ts           # e.g. insight.entity.ts — Entity definition
│   ├── <entity-name>.service.ts          # e.g. insight.service.ts — Business logic
│   ├── <entity-name>.controller.ts       # e.g. insight.controller.ts — REST endpoints
│   ├── <entity-name>.module.ts           # e.g. insight.module.ts — NestJS module wiring
│   ├── dto/
│   │   ├── create-<entity-name>.dto.ts   # e.g. create-insight.dto.ts — For POST
│   │   ├── update-<entity-name>.dto.ts   # e.g. update-insight.dto.ts — For PATCH
│   ├── seeds/
│   │   └── <entity-name>.seed.service.ts # e.g. insight.seed.service.ts — Demo data
│   └── index.ts                          # Barrel export (optional)
├── app.module.ts                         # Main NestJS app module
├── main.ts                               # App bootstrap
```

---

## Example Generated Files (per generator)

**Entity (**``**)**

```ts
@Entity({ name: '<entity-names>' })
export class <EntityName> {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  value!: string;
}
```

**Service (**``**)**

```ts
@Injectable()
export class <EntityName>Service {
  constructor(
    @InjectRepository(<EntityName>)
    private repo: Repository<<EntityName>>,
  ) {}

  findAll() {
    return this.repo.find();
  }
}
```

**Controller (**``**)**

```ts
@Controller('<entity-names>')
export class <EntityName>Controller {
  constructor(private readonly service: <EntityName>Service) {}

  @Get()
  getAll() {
    return this.service.findAll();
  }
}
```

**DTO (**``**)**

```ts
export class Create<EntityName>Dto {
  @IsString()
  value!: string;
}
```

**Seed (**``**)**

```ts
@Injectable()
export class <EntityName>SeedService {
  constructor(private readonly service: <EntityName>Service) {}

  async run() {
    await this.service.create({ value: '123.45' });
  }
}
```

---

## Shared Config (`packages/config`)

This package centralizes TypeScript, ESLint, Jest/Vitest, and other configuration so all apps and packages stay in sync.

### Installing in an App

From the monorepo root:

```bash
# Add package to the app
pnpm --filter <app-name> add @nestjs-react-boilerplate/config
```

Replace `<app-name>` with the workspace name (e.g. `@nestjs-react-boilerplate/api`).

### Using the Config

#### TypeScript
In your `tsconfig.json`:

```jsonc
{
  "extends": "@nestjs-react-boilerplate/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src", "test"]
}
```

#### ESLint
In `eslint.config.mjs`:

```js
import nodeConfig from "@nestjs-react-boilerplate/config/eslint/node";
export default [...nodeConfig];
```

#### Vitest
In `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import baseConfig from '@nestjs-react-boilerplate/config/vitest';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    globals: true,
  },
});
```

### Benefits
- Single source of truth for config
- Consistent linting, builds, and test rules
- Easier upgrades across all apps

---
