import 'reflect-metadata'

import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true })
  app.setGlobalPrefix('api')
  app.getHttpAdapter().get('/', (_req, res) => res.redirect('/docs'))
  const config = new DocumentBuilder()
    .setTitle('Org Health API')
    .setDescription('Organizational Health API (demo)')
    .setVersion('0.1.0')
    .build()
  const doc = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, doc)

  const port = Number(process.env.PORT || 3000)
  await app.listen(port)

  console.log(`API running on http://127.0.0.1:${port} (docs: /docs)`)
}
bootstrap()
