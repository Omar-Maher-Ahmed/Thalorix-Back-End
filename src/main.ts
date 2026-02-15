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
      // افحص الـ body قبل المعالجة
      const body = buf.toString();

      // لو فيه HTML tags
      if (body.match(/<[^>]*>/g)) {
        throw new BadRequestException('HTML tags are not allowed');
      }

      // لو فيه JavaScript events
      if (body.match(/\bon\w+\s*=/gi)) {
        throw new BadRequestException('Event handlers are not allowed');
      }

      // لو فيه javascript protocol
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
  }));
  app.useGlobalFilters(new (class implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();

      // لو Internal Server Error
      if (exception.status === 500 || !exception.status) {
        return response.status(400).json({
          statusCode: 400,
          message: 'Invalid input format',
          error: 'Bad Request'
        });
      }

      // غيره كده زي ما هو
      response.status(exception.status).json(exception.response);
    }
  })());

  // 2. setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Thalorix API Documentation')
    .setDescription('The API description for my project')
    .setVersion('1.0')
    //.addBearerAuth() // ضيف دي لو هتعمل نظام تسجيل دخول لاحقاً
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 5001);
  console.log(`Application is running on: ${await app.getUrl()}/docs`);
}
bootstrap();