import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.CORS_ORIGIN || true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Cuisine du Monde - Nantes API')
    .setDescription('API REST pour les restaurants du monde à Nantes')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'Cuisine du Monde - Nantes API Docs',
  });

  const port = process.env.PORT || 3001;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);

  const publicBaseUrl =
    process.env.PUBLIC_BASE_URL ||
    (host === '0.0.0.0' ? `http://<ton-ip>:${port}` : `http://${host}:${port}`);

  console.log(`🚀 API démarrée sur ${publicBaseUrl}`);
  console.log(`📚 Swagger: ${publicBaseUrl}/docs`);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
