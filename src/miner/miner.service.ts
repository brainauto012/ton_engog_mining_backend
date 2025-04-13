import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Miner, MinerDocument } from './miner.schema';

@Injectable()
export class MinerService {
  constructor(
    @InjectModel(Miner.name) private minerModel: Model<MinerDocument>,
  ) {}

  async findMiner(walletAddress: string): Promise<MinerDocument> {
    const miner = await this.minerModel.findOne({ walletAddress });
    if (!miner) {
      throw new NotFoundException('해당 지갑 주소를 가진 유저를 찾을 수 없습니다.');
    }
    return miner;
  }

  async getOrCreateMiner(walletAddress: string): Promise<MinerDocument> {
    return this.minerModel.findOneAndUpdate(
      { walletAddress },
      {},
      { upsert: true, new: true },
    );
  }

  async addPoints(walletAddress: string, points: number) {
    return this.minerModel.findOneAndUpdate(
      { walletAddress },
      { $inc: { points } },
      { upsert: true, new: true },
    );
  }

  async resetPoints(walletAddress: string): Promise<{ claimed: number }> {
    const miner = await this.findMiner(walletAddress);
    if (miner.points <= 0) {
      throw new BadRequestException('클레임할 포인트가 없습니다.');
    }

    const claimedPoints = miner.points;
    miner.totalClaimed += claimedPoints;
    miner.points = 0;
    await miner.save();

    return { claimed: claimedPoints };
  }
}
