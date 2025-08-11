// apps/api/src/app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { HealthController } from './health.controller'
import { OrganizationsModule } from './organizations/organizations.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? ['.env.test', '.env'] : ['.env']
    }),
    TypeOrmModule.forRootAsync({
      // Only Nest-specific bits here; DataSource comes from data-source.ts
      useFactory: (): TypeOrmModuleOptions => ({
        autoLoadEntities: true,
        entities: [], // rely on autoLoadEntities to avoid TS glob issues in tests
        synchronize: process.env.NODE_ENV !== 'production' && process.env.TYPEORM_SYNC === 'true',
        logging: process.env.NODE_ENV === 'test' ? false : process.env.NODE_ENV !== 'production'
      }),
      dataSourceFactory: async () => {
        const { default: AppDataSource } = await import('./database/data-source')
        if (!AppDataSource.isInitialized) await AppDataSource.initialize()
        return AppDataSource
      }
    }),
    OrganizationsModule
  ],
  controllers: [AppController, HealthController],
  providers: [AppService]
})
export class AppModule {}
