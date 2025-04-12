// src/mining/mining.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MiningService } from './mining.service';
import { MiningController } from './mining.controller';
import { Mining, MiningSchema } from './mining.schema';
import { Miner, MinerSchema } from './miner.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Miner.name, schema: MinerSchema },{ name: Mining.name, schema: MiningSchema }]),
  ],
  controllers: [MiningController],
  providers: [MiningService],
})
export class MiningModule {}
