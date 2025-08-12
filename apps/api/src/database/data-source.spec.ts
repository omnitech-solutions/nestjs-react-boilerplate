import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * We re-import the module each test to re-run top-level code (dotenv + construction).
 * Helpers below set up mocks before the dynamic import.
 */
const importFresh = async () => await import('./data-source')

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  // reset env used by data-source import
  delete process.env.NODE_ENV
  delete process.env.DOTENV_CONFIG_PATH
  ;(globalThis as any).__lastDSOpts = undefined
})

/**
 * Mock typeorm so we can assert on the ctor args passed to DataSource
 */
vi.mock('typeorm', () => {
  class DataSource {
    constructor(opts: unknown) {
      ;(globalThis as any).__lastDSOpts = opts
    }
  }
  // We don’t need real types at runtime; TS will compile the test.
  return { DataSource }
})

/**
 * Mock dotenv so we can assert which path was chosen
 */
const mockDotenv = (impl?: (args: any) => void) => {
  vi.doMock('dotenv', () => {
    return {
      config: vi.fn(impl ?? (() => undefined))
    }
  })
}

/**
 * Mock the local TypeOrmConfigService to control returned options
 */
const makeTypeOrmConfigMock = (options: Record<string, unknown>) => {
  vi.doMock('./typeorm.config.service', () => {
    class TypeOrmConfigService {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      constructor(_cfg: unknown) {}
      createTypeOrmOptions() {
        return options
      }
    }
    return { TypeOrmConfigService }
  })
}

describe('data-source', () => {
  it('uses .env.test when NODE_ENV=test and no DOTENV_CONFIG_PATH', async () => {
    process.env.NODE_ENV = 'test'
    mockDotenv()
    makeTypeOrmConfigMock({
      type: 'mysql',
      host: '127.0.0.1',
      autoLoadEntities: true,
      retryAttempts: 3
    })

    const { default: AppDataSource } = await importFresh()
    const dotenv = await import('dotenv')

    expect((dotenv as any).config).toHaveBeenCalledWith({ path: '.env.test' })

    const passed = (globalThis as any).__lastDSOpts as Record<string, unknown>
    expect(passed).toBeTruthy()
    expect(passed.type).toBe('mysql')
    expect(passed.host).toBe('127.0.0.1')
    // stripped keys should be gone
    expect(passed).not.toHaveProperty('autoLoadEntities')
    expect(passed).not.toHaveProperty('retryAttempts')

    // sanity: default export exists (constructed)
    expect(AppDataSource).toBeDefined()
  })

  it('prefers DOTENV_CONFIG_PATH when provided (non-test)', async () => {
    process.env.NODE_ENV = 'development'
    process.env.DOTENV_CONFIG_PATH = 'custom.env'
    mockDotenv()
    makeTypeOrmConfigMock({ type: 'postgres', host: 'localhost' })

    await importFresh()
    const dotenv = await import('dotenv')
    expect((dotenv as any).config).toHaveBeenCalledWith({ path: 'custom.env' })
  })

  it('falls back to .env when no test and no DOTENV_CONFIG_PATH', async () => {
    process.env.NODE_ENV = 'development'
    mockDotenv()
    makeTypeOrmConfigMock({ type: 'sqlite', database: ':memory:' })

    await importFresh()
    const dotenv = await import('dotenv')
    expect((dotenv as any).config).toHaveBeenCalledWith({ path: '.env' })
  })

  it('throws if TypeOrmConfigService does not provide a `type`', async () => {
    process.env.NODE_ENV = 'development'
    mockDotenv()
    makeTypeOrmConfigMock({
      // no `type` on purpose
      host: 'localhost',
      autoLoadEntities: true
    })

    await expect(importFresh()).rejects.toThrow(/Invalid TypeORM options: missing `type`/i)
  })

  it('strips all Nest-only keys before DataSource construction', async () => {
    process.env.NODE_ENV = 'development'
    mockDotenv()
    makeTypeOrmConfigMock({
      type: 'mysql',
      host: 'db',
      autoLoadEntities: true,
      keepConnectionAlive: true,
      retryAttempts: 5,
      retryDelay: 1000,
      toRetry: () => true,
      verboseRetryLog: true,
      manualInitialization: true
    })

    await importFresh()
    const passed = (globalThis as any).__lastDSOpts as Record<string, unknown>

    // kept
    expect(passed.type).toBe('mysql')
    expect(passed.host).toBe('db')

    // stripped
    for (const key of [
      'autoLoadEntities',
      'keepConnectionAlive',
      'retryAttempts',
      'retryDelay',
      'toRetry',
      'verboseRetryLog',
      'manualInitialization'
    ]) {
      expect(passed).not.toHaveProperty(key)
    }
  })
})
