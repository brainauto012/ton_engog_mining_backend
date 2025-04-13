import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClaimController } from './claim.controller';
import { ClaimService } from './claim.service';
import { Miner, MinerSchema } from '../miner/miner.schema';  // Miner 모델 import

@Module({
  imports: [MongooseModule.forFeature([{ name: Miner.name, schema: MinerSchema }])],
  controllers: [ClaimController],
  providers: [ClaimService],
})
export class ClaimModule {}
