import { NestFactory, ModuleRef } from '@nestjs/core';
import { Type } from '@nestjs/common';
import { SEED_CLASSES, SeedModule } from './seed.module';

async function clearAllSeeds() {
    const dynamicModule = await SeedModule.register();
    const app = await NestFactory.create(dynamicModule);

    const moduleRef = app.get(ModuleRef);
    const seedClasses = app.get<Type<any>[]>(SEED_CLASSES);

    for (const SeedClass of seedClasses.reverse()) {
        const instance: any = moduleRef.get(SeedClass, { strict: false });
        if (instance?.clear) {
            console.log(`[seed] Clearing ${SeedClass.name}...`);
            await instance.clear();
        }
    }

    await app.close();
    console.log('[seed] All seeds cleared.');
}

clearAllSeeds().catch((err) => {
    console.error(err);
    process.exit(1);
});