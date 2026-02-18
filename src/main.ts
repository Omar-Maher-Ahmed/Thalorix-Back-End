import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ArgumentsHost, BadRequestException, ExceptionFilter, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as helmet from 'helmet';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.use(express.json({
    verify: (req: any, res, buf) => {
      // check body before processing
      const body = buf.toString();
      // if HTML tags
      if (body.match(/<[^>]*>/g)) {
        throw new BadRequestException('HTML tags are not allowed');
      }
      // if JavaScript events
      if (body.match(/\bon\w+\s*=/gi)) {
        throw new BadRequestException('Event handlers are not allowed');
      }
      // if javascript protocol
      if (body.match(/javascript:/gi)) {
        throw new BadRequestException('JavaScript protocol is not allowed');
      }
    }
  }));
  app.use(helmet.default());
  app.setGlobalPrefix('api/v1');

  // Validation settings
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    errorHttpStatusCode: 400,
  }));
  app.useGlobalFilters(new (class implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();

      // if Internal Server Error
      if (exception.status === 500 || !exception.status) {
        return response.status(400).json({
          statusCode: 400,
          message: 'Invalid input format',
          error: 'Bad Request'
        });
      }

      response.status(exception.status).json(exception.response);
    }
  })());

  // 2. setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Thalorix API Documentation')
    .setDescription('The API description for my project')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 5001);
  console.log(`Application is running on: ${await app.getUrl()}/docs`);
}
bootstrap();