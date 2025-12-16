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
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  
  // 로컬 IP 주소 가져오기
  const networkInterfaces = os.networkInterfaces();
  let localIp = 'localhost';
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    if (interfaces) {
      for (const iface of interfaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIp = iface.address;
          break;
        }
      }
      if (localIp !== 'localhost') break;
    }
  }
  
  console.log(`Application is running on:`);
  console.log(`  - Local:   http://localhost:${port}`);
  console.log(`  - Network: http://${localIp}:${port}`);
}
bootstrap();


