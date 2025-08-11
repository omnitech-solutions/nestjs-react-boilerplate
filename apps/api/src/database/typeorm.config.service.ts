import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm'

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly cfg: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const nodeEnv = this.cfg.get('NODE_ENV') ?? process.env.NODE_ENV
    const isProd = nodeEnv === 'production'
    const isTest = nodeEnv === 'test'

    const baseName = this.cfg.get<string>('DATABASE_NAME') ?? 'tali_talent_org_health_development'
    const database = isTest ? baseName.replace(/_development$/, '') + '_test' : baseName

    const toBool = (v: unknown, def = false) =>
      v === 'true' || v === true ? true : v === 'false' || v === false ? false : def

    const sslEnabled = toBool(this.cfg.get('DATABASE_SSL_ENABLED'))
    const ssl = sslEnabled
      ? {
          rejectUnauthorized: toBool(this.cfg.get('DATABASE_REJECT_UNAUTHORIZED'), true),
          ca: this.cfg.get<string>('DATABASE_CA'),
          key: this.cfg.get<string>('DATABASE_KEY'),
          cert: this.cfg.get<string>('DATABASE_CERT')
        }
      : undefined

    const opts: TypeOrmModuleOptions = {
      type: 'mysql',
      url: this.cfg.get<string>('DATABASE_URL'),
      host: this.cfg.get<string>('DATABASE_HOST', '127.0.0.1'),
      port: Number(this.cfg.get<string | number>('DATABASE_PORT') ?? 3307),
      username: this.cfg.get<string>('DATABASE_USERNAME') ?? this.cfg.get<string>('DB_USER', 'root'),
      password: this.cfg.get<string>('DATABASE_PASSWORD') ?? this.cfg.get<string>('DB_PASSWORD', 'password'),
      database,
      synchronize: !isProd && toBool(this.cfg.get('DATABASE_SYNCHRONIZE')),
      logging: isTest ? false : !isProd,
      autoLoadEntities: true,
      // avoid TS globs in tests (Vitest ESM/CJS friction)
      entities: isTest ? [] : [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: isTest ? [] : [__dirname + '/migrations/**/*{.ts,.js}'],
      extra: {
        connectionLimit: Number(this.cfg.get('DATABASE_MAX_CONNECTIONS') ?? 100)
      },
      ...(ssl ? { ssl: ssl as any } : {})
    }

    if (!isProd) {
      // mask the password in logs

      console.log('[TypeORM Config]', {
        ...opts,
        password: opts.password ? '***' : undefined
      })
    }

    return opts
  }
}
