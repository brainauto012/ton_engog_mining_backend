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

    const existingMining = await this.miningModel.findOne({ walletAddress });
    if (existingMining) {
      throw new BadRequestException('이미 채굴 중입니다.');
    }

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
  @Cron(CronExpression.EVERY_MINUTE)
  async calculateMiningPoints() {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    
    // 1분 이상 경과한 mining 레코드를 찾음
    const miningRecords = await this.miningModel.find({ lastUpdated: { $lte: oneMinuteAgo } });
    const minerCount = await this.minerModel.countDocuments(); // 전체 유저 수를 구함
    const hashRate = this.calculateHashRate(minerCount); // 전체 유저 수에 기반한 공통 해시레이트 계산
    const pointsGained = this.calculatePoints(hashRate); // 포인트 계산
  
    const now = new Date();
  
    for (const mining of miningRecords) {
      // mining 로그에 포인트 누적 (기록 용도)
      mining.pointsGained += pointsGained;
      mining.lastUpdated = now; // lastUpdated 갱신
      await mining.save();
  
      // miner 포인트도 누적 (실제 사용자 보상)
      await this.minerModel.findOneAndUpdate(
        { walletAddress: mining.walletAddress },
        { $inc: { points: pointsGained } },
        { upsert: true, new: true }
      );
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