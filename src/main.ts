import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ArgumentsHost,
  BadRequestException,
  ExceptionFilter,
  ValidationPipe,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as helmet from 'helmet';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableCors({
    origin: true, // Allow all origins (or specify your frontend URL)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  app.use(
    express.json({
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
      },
    }),
  );
  app.use(helmet.default());
  app.setGlobalPrefix('api/v1');

  // Validation settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      errorHttpStatusCode: 400,
    }),
  );
  app.useGlobalFilters(
    new (class implements ExceptionFilter {
      catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        // Only mask true internal server errors (no status or status 500)
        // All HTTP exceptions (including 400 validation errors) pass through with their real response
        const status = exception.status ?? exception.statusCode;

        if (!status || status === 500) {
          return response.status(500).json({
            statusCode: 500,
            message: 'Internal server error',
            error: 'Internal Server Error',
          });
        }

        // Pass through the actual HTTP exception response (preserves ValidationPipe error details)
        response.status(status).json(exception.response);
      }
    })(),
  );

  // 2. setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Thalorix API Documentation')
    .setDescription(
      'Complete API documentation for the Thalorix platform. ' +
      'Use the Authorize button to enter your JWT Bearer token before calling protected endpoints.',
    )
    .setVersion('1.0')
    // Named scheme used by Orders controller (@ApiBearerAuth('access-token'))
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT access token (named scheme: access-token)',
        in: 'header',
      },
      'access-token',
    )
    // Default scheme used by Auth, Chat, Community, Users, Marketplace, Admin controllers
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT access token',
        in: 'header',
      },
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 5001, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}/docs`);
}
bootstrap();
