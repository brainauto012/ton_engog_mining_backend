import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Miner } from '../miner/miner.schema';  // miner 스키마
import { MiningService } from '../mining/mining.service';  // MiningService 임포트

@Injectable()
export class ClaimService {
  constructor(
    @InjectModel(Miner.name) private readonly minerModel: Model<Miner>,  // miner 스키마 모델
    private readonly miningService: MiningService,  // MiningService 의존성 주입
  ) {}

  // Claim 처리 함수
  async processClaim(walletAddress: string) {  
    // 지갑 주소로 miner 정보 가져오기
    console.log(`[ClaimService] Processing claim for ${walletAddress}`);
    const miner = await this.minerModel.findOne({ walletAddress });  
    if (!miner) {
      throw new Error('Miner not found');
    }

    // 포인트가 0 이상인지 확인
    if (miner.points <= 0) {
      throw new Error('Insufficient points');
    }

    // 포인트 차감 (클레임 후)
    miner.points -= 100; // 예시로 100포인트 차감
    await miner.save();

    // MiningService의 claimPoints 호출
    return this.miningService.claimPoints(walletAddress);
  }
}
