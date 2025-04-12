// src/mining/mining.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mining, MiningDocument } from './mining.schema';
import { Miner, MinerDocument } from './miner.schema';
import { StartMiningDto } from './dto/start-mining.dto';

@Injectable()
export class MiningService {
  constructor(
    @InjectModel(Mining.name) private miningModel: Model<MiningDocument>,
    @InjectModel(Miner.name) private minerModel: Model<MinerDocument>,
  ) {}

  // 채굴 시작: 포인트를 누적
  async startMining(startMiningDto: StartMiningDto) {
    const { walletAddress, hashRate } = startMiningDto;

    const pointsGained = this.calculatePoints(hashRate);

    // 채굴 로그 저장
    await this.miningModel.create({
      walletAddress,
      hashRate,
      pointsGained,
    });

    // Miner 포인트 누적
    const miner = await this.minerModel.findOneAndUpdate(
      { walletAddress },
      { $inc: { points: pointsGained } },
      { upsert: true, new: true },
    );

    return {
      message: '채굴이 완료되었습니다.',
      currentPoints: miner.points,
    };
  }

  // 포인트 계산 로직
  private calculatePoints(hashRate: number): number {
    const BASE_MULTIPLIER = 10;
    return hashRate * BASE_MULTIPLIER;
  }

  // 현재 포인트 조회
  async getPoints(walletAddress: string) {
    const miner = await this.minerModel.findOne({ walletAddress });
    return { points: miner?.points ?? 0 };
  }

  // 포인트 클레임 처리
  async claimPoints(walletAddress: string) {
    const miner = await this.minerModel.findOne({ walletAddress });

    if (!miner) {
      throw new NotFoundException('해당 지갑 주소를 가진 유저를 찾을 수 없습니다.');
    }

    if (miner.points <= 0) {
      throw new BadRequestException('클레임할 포인트가 없습니다.');
    }

    const claimedPoints = miner.points;

    // 실제 토큰 전송은 블록체인 로직과 연결 필요 (여기선 생략)
    // 예: await sendToken(walletAddress, claimedPoints);

    // 포인트 0으로 초기화 + 총 클레임 누적
    miner.totalClaimed += claimedPoints;
    miner.points = 0;
    await miner.save();

    return {
      message: '포인트 클레임이 완료되었습니다.',
      claimed: claimedPoints,
    };
  }

  async getMiningStatus(walletAddress: string) {
    const miner = await this.minerModel.findOne({ walletAddress });
  
    if (!miner) {
      throw new NotFoundException('해당 지갑 주소를 가진 유저를 찾을 수 없습니다.');
    }
  
    return {
      walletAddress: miner.walletAddress,
      points: miner.points,
      lastUpdated: miner.updatedAt,
    };
  }
}
