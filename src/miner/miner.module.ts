import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Miner, MinerSchema } from './miner.schema';
import { MinerService } from './miner.service';
import { MinerController } from './miner.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Miner.name, schema: MinerSchema }]),
  ],
  controllers: [MinerController],
  providers: [MinerService],
  exports: [MinerService],
})
export class MinerModule {}