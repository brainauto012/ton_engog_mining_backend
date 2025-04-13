// src/mining/mining.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mining, MiningDocument } from './mining.schema';
import { Miner, MinerDocument } from './miner.schema';
import { StartMiningDto } from './dto/start-mining.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { sendJetton } from '../ton/sendJetton';  // sendJetton을 import
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class MiningService {
  constructor(
    @InjectModel(Mining.name) private miningModel: Model<MiningDocument>,
    @InjectModel(Miner.name) private minerModel: Model<MinerDocument>,
  ) {}


  // 채굴 시작: 포인트를 누적
  async startMining(startMiningDto: StartMiningDto) {
    const { walletAddress } = startMiningDto;

    const minerCount = await this.minerModel.countDocuments();

    // 해시레이트 계산
    const hashRate = this.calculateHashRate(minerCount);

    // 포인트 계산
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

  // 해시레이트 계산 (유저 수 반비례)
  private calculateHashRate(minerCount: number): number {
    const BASE_HASH = 100;
    const adjustedMinerCount = minerCount === 0 ? 1 : minerCount;
    return Math.floor(BASE_HASH / adjustedMinerCount);
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

  // 채굴 포인트 계산 및 자동 업데이트
  @Cron(CronExpression.EVERY_MINUTE) // 1분마다 채굴 포인트를 갱신
  async calculateMiningPoints() {
    const miningRecords = await this.miningModel.find(); // mining 모델에서 채굴 기록 조회
    const now = new Date();

    for (const mining of miningRecords) {
      // mining 모델에서 해시레이트 가져오기
      const hashRate = mining.hashRate;
      const pointsGained = this.calculatePoints(hashRate);

      // 채굴 포인트 업데이트
      mining.pointsGained += pointsGained;
      await mining.save();
    }
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

    if (!process.env.JETTON_WALLET_ADDRESS || !process.env.TON_ENDPOINT) {
      throw new Error('환경변수가 올바르게 설정되지 않았습니다.');
    }

    const jettonWalletAddress = process.env.JETTON_WALLET_ADDRESS;
    const tonEndpoint = process.env.TON_ENDPOINT;

    // ENGOG 토큰 전송
    try {
      const result = await sendJetton({
        recipient: walletAddress,
        jettonWalletAddress, // 환경변수에 지정된 지갑 주소
        jettonAmount: claimedPoints, // 클레임한 포인트만큼 토큰 전송
        tonEndpoint // TON 엔드포인트
      });

      if (!result.success) {
        throw new Error('토큰 전송에 실패했습니다.');
      }
    } catch (error) {
      throw new BadRequestException('토큰 전송 실패: ' + error.message);
    }

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
      totalClaimed: miner.totalClaimed ?? 0,
      lastUpdated: miner.updatedAt,
      isMining: true,
    };
  }

  async claimToContract(userId: string, points: number) {
    console.log(`Claiming ${points} points for user ${userId} to contract...`);
    return { success: true, transactionId: 'tx1234' };
  }
}