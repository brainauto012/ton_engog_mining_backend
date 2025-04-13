import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MiningModule } from './mining/mining.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const mongoUri = configService.get<string>('MONGO_URI');
        if (!mongoUri) {
          Logger.error('❌ MONGO_URI is not defined in environment variables');
          throw new Error('MONGO_URI is not defined');
        }
        Logger.log('✅ MONGO_URI loaded successfully');
        return { uri: mongoUri };
      },
    }),
    MiningModule,
  ],
})
export class AppModule {}
