import { NestFactory } from '@nestjs/core';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });

async function bootstrap() {
  const { AppModule } = require('./app.module');
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
