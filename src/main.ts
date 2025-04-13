import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ CORS 활성화
  app.enableCors({
    origin: true, // 모든 도메인 허용 (또는 'https://your-frontend-url'로 제한 가능)
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();