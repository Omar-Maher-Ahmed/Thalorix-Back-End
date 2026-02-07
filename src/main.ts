import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation settings
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // 2. setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Thalorix API Documentation')
    .setDescription('The API description for my project') // وصف المشروع
    .setVersion('1.0') // إصدار الـ API
    //.addBearerAuth() // ضيف دي لو هتعمل نظام تسجيل دخول لاحقاً
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // 3. تحديد المسار اللي هيفتح منه سوجر (هنا هيكون localhost:3000/docs)
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}/docs`); // رسالة مساعدة في الـ terminal
}
bootstrap();