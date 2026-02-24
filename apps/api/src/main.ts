import './instrument'; // MUST BE THE VERY FIRST IMPORT
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';

// MONKEY PATCH: BigInt Serialization
// Critical for financial math. Converts BigInt to string in JSON responses.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Security Headers
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Apply Sentry Interceptor globally to catch unhandled backend panics
  app.useGlobalInterceptors(new SentryInterceptor());

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1', // Routes default to v1 automatically
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Givar API running on: http://localhost:${port}/api`);
}
bootstrap();