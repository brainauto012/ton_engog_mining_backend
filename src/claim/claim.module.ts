//claim.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClaimController } from './claim.controller';
import { ClaimService } from './claim.service';
import { Miner, MinerSchema } from '../miner/miner.schema';
import { MiningModule } from '../mining/mining.module'; // 추가

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Miner.name, schema: MinerSchema }]),
    MiningModule, // 추가
  ],
  controllers: [ClaimController],
  providers: [ClaimService],
})
export class ClaimModule {}
