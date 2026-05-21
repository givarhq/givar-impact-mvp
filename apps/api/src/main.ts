import './instrument'; // MUST BE THE VERY FIRST IMPORT
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// MONKEY PATCH: BigInt Serialization
// Critical for financial math. Converts BigInt to string in JSON responses.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Hardened Security Headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // CSP is handled by Next.js Edge Middleware. The API serves no HTML, so disabling CSP here is safe.
    contentSecurityPolicy: false,
  }));

  // Strict CORS Policy
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-paystack-signature'],
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // Reject payload pollution platform-wide
      transform: true,
    }),
  );

  // Apply Sentry Interceptor globally to catch unhandled backend panics
  app.useGlobalInterceptors(new SentryInterceptor());

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api');

  // Swagger API Documentation Setup (Hidden in Production)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Givar Platform API')
      .setDescription('The immutable ledger and discovery protocol for Givar Impact.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Givar API running on: http://localhost:${port}/api`);
}
bootstrap();