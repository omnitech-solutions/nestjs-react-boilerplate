import 'reflect-metadata'
import { DataSource, DataSourceOptions } from 'typeorm'
import * as dotenv from 'dotenv'
import { ConfigService } from '@nestjs/config'
import { TypeOrmConfigService } from './typeorm.config.service'

// Load env for CLI/migrations (Nest runtime uses ConfigModule)
dotenv.config({
  path:
    process.env.NODE_ENV === 'test'
      ? process.env.DOTENV_CONFIG_PATH || '.env.test'
      : process.env.DOTENV_CONFIG_PATH || '.env'
})

// Build options via the same ConfigService used in Nest
const cfg = new ConfigService()
const factory = new TypeOrmConfigService(cfg)
const nestOpts = factory.createTypeOrmOptions() as Record<string, unknown>

// Remove Nest-only fields without binding unused vars
const stripKeys = [
  'autoLoadEntities',
  'keepConnectionAlive',
  'retryAttempts',
  'retryDelay',
  'toRetry',
  'verboseRetryLog',
  'manualInitialization'
] as const

const dsOpts: Record<string, unknown> = { ...nestOpts }
for (const k of stripKeys) delete (dsOpts as any)[k]

// Narrow to DataSourceOptions by checking the discriminator
function isDataSourceOptions(o: unknown): o is DataSourceOptions {
  return !!o && typeof o === 'object' && 'type' in (o as any)
}

// Fail early if misconfigured (e.g., missing `type`)
if (!isDataSourceOptions(dsOpts)) {
  throw new Error(
    'Invalid TypeORM options: missing `type`. Ensure TypeOrmConfigService sets `type` (e.g., "postgres", "mysql").'
  )
}

// Create the DataSource (cast via unknown after runtime guard)
const AppDataSource = new DataSource(dsOpts as unknown as DataSourceOptions)

export default AppDataSource
