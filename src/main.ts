import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('/api', {
    exclude: ['swagger-ui'],
  });

  app.useGlobalPipes(new ValidationPipe());
  app.enableShutdownHooks();
  if (process.env.NODE_ENV !== 'production') app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('HH Hack2025')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger-ui', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
