import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MiningModule } from './mining/mining.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
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
