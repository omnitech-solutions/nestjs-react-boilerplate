import { NestFactory } from '@nestjs/core'
import { ModuleRef } from '@nestjs/core'
import { Type } from '@nestjs/common'
import { SEED_CLASSES, SeedModule } from './seed.module'

async function runAllSeeds() {
  const dynamicModule = await SeedModule.register()
  const app = await NestFactory.create(dynamicModule, {
    logger: ['log', 'warn', 'error']
  })

  const moduleRef = app.get(ModuleRef)
  const seedClasses = app.get<Type<any>[]>(SEED_CLASSES)

  for (const SeedClass of seedClasses) {
    const instance: any = moduleRef.get(SeedClass, { strict: false })
    if (instance?.run && typeof instance.run === 'function') {
      console.log(`[seed] Running ${SeedClass.name}...`)
      await instance.run()
    }
  }

  await app.close()
  console.log('[seed] All seeds executed successfully.')
}

runAllSeeds().catch(err => {
  console.error('[seed] Seeding failed:', err)
  process.exit(1)
})
