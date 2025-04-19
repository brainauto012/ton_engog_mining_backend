// claim.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Miner } from '../miner/miner.schema';  // miner 스키마
import { MiningService } from '../mining/mining.service';  // 실제 포인트 계산
import { sendJetton } from '../ton/sendJetton';

@Injectable()
export class ClaimService {
  constructor(
    @InjectModel(Miner.name) private readonly minerModel: Model<Miner>,  // miner 스키마 모델
    private readonly miningService: MiningService,
  ) {}

  // Claim 처리 함수
  async processClaim(walletAddress: string) {  // userId 대신 walletAddress로 변경
    // 지갑 주소로 miner 정보 가져오기
    const miner = await this.minerModel.findOne({ walletAddress });  // walletAddress로 조회
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

    // 스마트 컨트랙트 호출 (실제 호출 대신 시뮬레이션)
    const result = await this.miningService.claimToContract(walletAddress, 100);  // 지갑 주소로 수정

    return result; // 스마트컨트랙트 호출 결과 반환
  }
}
