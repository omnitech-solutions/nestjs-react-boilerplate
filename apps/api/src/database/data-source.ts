import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { TypeOrmConfigService } from './typeorm.config.service';

// Load env for CLI/migrations. (Nest runtime loads via ConfigModule.)
dotenv.config({
    path:
        process.env.NODE_ENV === 'test'
            ? process.env.DOTENV_CONFIG_PATH || '.env.test'
            : process.env.DOTENV_CONFIG_PATH || '.env',
});

// Build options via the same ConfigService used in Nest
const cfg = new ConfigService();
const factory = new TypeOrmConfigService(cfg);
const nestOpts = factory.createTypeOrmOptions();

// Omit Nest-only fields to get a valid DataSourceOptions
// (autoLoadEntities, keepConnectionAlive, retryAttempts, etc.)
const {
    autoLoadEntities,
    keepConnectionAlive,
    retryAttempts,
    retryDelay,
    toRetry,
    verboseRetryLog,
    manualInitialization,
    // anything else Nest adds in future
    ...dsOpts
} = nestOpts as any;

// Ensure the type aligns with TypeORM expectations
const AppDataSource = new DataSource(dsOpts as DataSourceOptions);

// Export only ONE DataSource instance for TypeORM CLI compatibility
export default AppDataSource;