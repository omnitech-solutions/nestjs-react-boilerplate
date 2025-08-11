// apps/api/src/database/seeds/seed.module.ts
import { Module, DynamicModule, Provider, InjectionToken, Type } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import fg from 'fast-glob'

export const SEED_CLASSES = 'SEED_CLASSES' as InjectionToken

async function discoverSeedClasses(): Promise<Type<any>[]> {
  const files = await fg(['src/**/seeds/**/*seed.service.{ts,js}'], {
    cwd: process.cwd(),
    absolute: true,
    onlyFiles: true
  })

  const classes: Type<any>[] = []
  for (const file of files) {
    const mod = await import(file)
    for (const exp of Object.values(mod)) {
      if (typeof exp === 'function' && /SeedService$/.test((exp as any).name)) {
        classes.push(exp as Type<any>)
      }
    }
  }

  // Stable order: by file path (implicitly via glob order) then class name
  classes.sort((a, b) => a.name.localeCompare(b.name))
  return classes
}

@Module({})
export class SeedModule {
  static async register(): Promise<DynamicModule> {
    const seedClasses = await discoverSeedClasses()

    // Auto-discover all entity classes so @InjectRepository(...) works in seed services
    const entityFiles = await fg(['src/**/*.entity.{ts,js}'], {
      cwd: process.cwd(),
      absolute: true,
      onlyFiles: true
    })

    const entities: Type<any>[] = []
    for (const file of entityFiles) {
      const mod = await import(file)
      for (const exp of Object.values(mod)) {
        if (typeof exp === 'function') {
          entities.push(exp as Type<any>)
        }
      }
    }

    // Make them valid Nest providers
    const seedProviders: Provider[] = seedClasses.map(Cls => ({
      provide: Cls,
      useClass: Cls
    }))

    const seedClassesToken: Provider = {
      provide: SEED_CLASSES,
      useValue: seedClasses as Type<any>[]
    }

    return {
      module: SeedModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: process.env.NODE_ENV === 'test' ? ['.env.test', '.env'] : ['.env']
        }),
        TypeOrmModule.forRootAsync({
          useFactory: (): TypeOrmModuleOptions => ({
            autoLoadEntities: true,
            entities: [],
            synchronize: false,
            logging: process.env.NODE_ENV !== 'production'
          }),
          dataSourceFactory: async () => {
            const { default: AppDataSource } = await import('../data-source')
            if (!AppDataSource.isInitialized) await AppDataSource.initialize()
            return AppDataSource
          }
        }),
        TypeOrmModule.forFeature(entities)
      ],
      providers: [seedClassesToken, ...seedProviders],
      exports: [seedClassesToken, ...seedProviders]
    }
  }
}
