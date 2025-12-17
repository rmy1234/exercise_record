import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { json } from 'express';
import * as os from 'os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // JSON body parser 크기 제한 증가 (10MB로 설정, 프로필 이미지용)
  app.use(json({ limit: '10mb' }));

  // CORS 설정 (Android 앱에서 접근 가능하도록)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Validation 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '10.2.2.116'; // 기본 IP 주소 설정
  await app.listen(port, host);
  
  console.log(`Application is running on:`);
  console.log(`  - http://${host}:${port}`);
  console.log(`  - http://localhost:${port} (if accessible)`);
}
bootstrap();


