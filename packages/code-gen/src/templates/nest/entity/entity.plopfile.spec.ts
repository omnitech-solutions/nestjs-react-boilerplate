import { describe, it, expect, beforeAll } from 'vitest';
import nodePlop from 'node-plop';
import * as fs from 'node:fs/promises';
import fssync from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

//
// Helpers
//
async function mkTmp(prefix = 'nrp-nodeplop-') {
    return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function readFileIfExists(p: string) {
    try { return await fs.readFile(p, 'utf8'); } catch { return null; }
}

const plopfile = path.resolve(__dirname, './entity.plopfile.ts');

function schemaOrgUuid() {
    return {
        entityName: 'Organization',
        tableName: 'organizations',
        primaryKey: { name: 'uuid', type: 'uuid', options: { strategy: 'uuid' } },
        properties: {
            name: { type: 'varchar', length: 255 },
            industry: { type: 'varchar', length: 100, nullable: true },
            website: { type: 'varchar', length: 2048, nullable: true },
            notes: { type: 'text', nullable: true },
        },
    };
}

function schemaUserIncrement() {
    return {
        entityName: 'UserAccount',
        tableName: 'user_accounts',
        primaryKey: { name: 'id', type: 'int', options: { strategy: 'increment' } },
        properties: {
            email: { type: 'varchar', length: 320 },
            isActive: { type: 'boolean' },
            bio: { type: 'text', nullable: true },
        },
    };
}

//
// Suite
//
describe('plop entity generator (node-plop)', () => {

    it('generates entity with uuid PK (inline JSON)', async () => {
        const tmp = await mkTmp();
        const plop = await nodePlop(plopfile, { destBasePath: tmp, force: true });
        const generator = plop.getGenerator('entity');

        const schema = JSON.stringify(schemaOrgUuid());

        const results = await generator.runActions({ schema });
        expect(results.failures.length).toBe(0);

        const filePath = path.join(tmp, 'src/entities/organization.entity.ts');
        const body = await readFileIfExists(filePath);
        expect(body).toBeTruthy();

        expect(body!).toContain(`@Entity({ name: 'organizations' })`);
        expect(body!).toContain(`export class Organization`);
        expect(body!).toContain(`@PrimaryGeneratedColumn('uuid', { name: 'uuid' })`);
        expect(body!).toContain(`@Column({ type: 'varchar', length: 255 })`);
        expect(body!).toMatch(/industry\?: string \| null/);
        expect(body!).toContain(`@CreateDateColumn({ name: 'created_at', type: 'datetime' })`);
        expect(body!).toContain(`@UpdateDateColumn({ name: 'updated_at', type: 'datetime' })`);
    });

    it('generates entity with increment PK (inline JSON)', async () => {
        const tmp = await mkTmp();
        const plop = await nodePlop(plopfile, { destBasePath: tmp, force: true });
        const generator = plop.getGenerator('entity');

        const schema = JSON.stringify(schemaUserIncrement());

        const results = await generator.runActions({ schema });
        expect(results.failures.length).toBe(0);

        const filePath = path.join(tmp, 'src/entities/user-account.entity.ts'); // kebabCase of "UserAccount"
        const body = await readFileIfExists(filePath);
        expect(body).toBeTruthy();

        expect(body!).toContain(`@Entity({ name: 'user_accounts' })`);
        expect(body!).toContain(`export class UserAccount`);
        expect(body!).toContain(`@PrimaryGeneratedColumn('increment', { name: 'id' })`);
        expect(body!).toContain(`@Column({ type: 'varchar', length: 320 })`);
        expect(body!).toContain(`@Column({ type: 'boolean' })`);
        expect(body!).toMatch(/bio\?: string \| null/);
    });

    it('respects nullable + length on fields (inline JSON)', async () => {
        const tmp = await mkTmp();
        const plop = await nodePlop(plopfile, { destBasePath: tmp, force: true });
        const generator = plop.getGenerator('entity');

        const s = {
            entityName: 'Article',
            tableName: 'articles',
            primaryKey: { name: 'id', type: 'int', options: { strategy: 'increment' } },
            properties: {
                title: { type: 'varchar', length: 200 },
                subtitle: { type: 'varchar', length: 300, nullable: true },
                publishedAt: { type: 'datetime', nullable: true },
                body: { type: 'text' },
            },
        };

        const results = await generator.runActions({ schema: JSON.stringify(s) });
        expect(results.failures.length).toBe(0);

        const filePath = path.join(tmp, 'src/entities/article.entity.ts');
        const body = await readFileIfExists(filePath);
        expect(body).toBeTruthy();

        expect(body!).toContain(`@Entity({ name: 'articles' })`);
        expect(body!).toContain(`@Column({ type: 'varchar', length: 200 })`);
        expect(body!).toContain(`@Column({ type: 'varchar', length: 300, nullable: true })`);
        expect(body!).toMatch(/subtitle\?: string \| null/);
        expect(body!).toContain(`@Column({ type: 'datetime', nullable: true })`);
        expect(body!).toMatch(/publishedAt\?: Date \| null/);
    });

    it('fails validation with helpful error', async () => {
        const tmp = await mkTmp();
        const plop = await nodePlop(plopfile, { destBasePath: tmp, force: true });
        const generator = plop.getGenerator('entity');

        const bad = {
            entityName: 'Broken',
            // tableName missing on purpose
            primaryKey: { name: 'uuid', type: 'uuid', options: { strategy: 'uuid' } },
            properties: { name: { type: 'varchar', length: 255 } },
        };

        const results = await generator.runActions({ schema: JSON.stringify(bad) });

        // One action: the async validator action throws → failures > 0
        expect(results.failures.length).toBeGreaterThan(0);
        const first = results.failures[0];
        let msg = '';

        if (first) {
            const err = (first as any).error;
            if (typeof err === 'string') {
                msg = err;
            } else if (err && typeof err.message === 'string') {
                msg = err.message;
            } else if (typeof (first as any).message === 'string') {
                msg = (first as any).message;
            }
        }

        expect(msg.toLowerCase()).toContain('invalid json schema');
        expect(msg.toLowerCase()).toContain('invalid json schema');
    });
});