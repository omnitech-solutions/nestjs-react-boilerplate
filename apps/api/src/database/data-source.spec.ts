import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { DataSource } from 'typeorm';
import type { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

const importFresh = async () => {
    vi.resetModules();
    return await import('./data-source');
};

const withEnv = async (overrides: Record<string, string | undefined>) => {
    const original = { ...process.env };
    Object.entries(overrides).forEach(([k, v]) => {
        if (v === undefined) delete (process.env as any)[k];
        else (process.env as any)[k] = v;
    });
    const mod = await importFresh();
    const ds = mod.AppDataSource as DataSource;
    // restore
    process.env = original;
    return ds;
};

describe('AppDataSource (MySQL)', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
    });
    afterEach(() => {
        vi.resetModules();
    });

    it('uses MySQL with sane defaults when env is minimal', async () => {
        const ds = await withEnv({
            NODE_ENV: 'development',
            DATABASE_NAME: 'tali_talent_org_health_development',
            DATABASE_TYPE: undefined,
            DATABASE_PORT: undefined,
            DATABASE_HOST: undefined,
            DATABASE_USERNAME: undefined,
            DATABASE_PASSWORD: undefined,
            DATABASE_SYNCHRONIZE: undefined,
            DATABASE_MAX_CONNECTIONS: undefined,
            DATABASE_SSL_ENABLED: undefined,
        });

        const opts = ds.options as MysqlConnectionOptions;
        expect(opts.type).toBe('mysql');
        expect(opts.host).toBe('127.0.0.1');
        expect(opts.port).toBe(3307);
        expect(opts.username).toBe('root');
        expect(opts.password).toBe('password');
        expect(opts.database).toBe('tali_talent_org_health_development');
        expect(opts.synchronize).toBe(false);
        expect(opts.logging).toBe(true);
        expect(opts.migrations?.length).toBeGreaterThan(0);
        expect((opts as any).extra.connectionLimit).toBe(100);
        expect((opts as any).ssl).toBeUndefined();
    });

    it('derives a *_test database and empty migrations in NODE_ENV=test', async () => {
        const ds = await withEnv({
            NODE_ENV: 'test',
            DATABASE_NAME: 'tali_talent_org_health_development',
        });
        const opts = ds.options as MysqlConnectionOptions;
        expect(opts.database).toBe('tali_talent_org_health_test');
        expect(opts.migrations).toEqual([]);
    });

    it('parses pool size and enables SSL when configured', async () => {
        const ds = await withEnv({
            NODE_ENV: 'production',
            DATABASE_NAME: 'prod_db',
            DATABASE_MAX_CONNECTIONS: '25',
            DATABASE_SSL_ENABLED: 'true',
            DATABASE_REJECT_UNAUTHORIZED: 'true',
            DATABASE_CA: '---ca---',
            DATABASE_KEY: '---key---',
            DATABASE_CERT: '---cert---',
        });
        const opts = ds.options as MysqlConnectionOptions;
        expect(opts.logging).toBe(false);
        expect((opts as any).extra.connectionLimit).toBe(25);
        const ssl = (opts as any).ssl;
        expect(ssl).toBeTruthy();
        expect(ssl.rejectUnauthorized).toBe(true);
        expect(ssl.ca).toBe('---ca---');
        expect(ssl.key).toBe('---key---');
        expect(ssl.cert).toBe('---cert---');
    });

    it('respects DATABASE_URL when provided', async () => {
        const ds = await withEnv({
            DATABASE_URL: 'mysql://user:pass@db.example:3307/appdb',
            DATABASE_NAME: 'ignored_when_url_set',
        });
        const opts = ds.options as MysqlConnectionOptions;
        expect(opts.url).toBe('mysql://user:pass@db.example:3307/appdb');
    });
});