import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface MinerDocument extends Miner, Document {
  calculateMiningPoints: (now?: Date) => number;
}

@Schema({ timestamps: true })
export class Miner {
  @Prop({ required: true, unique: true })
  walletAddress: string;

  @Prop({ default: 0 })
  points: number;

  @Prop({ default: 0 })
  totalClaimed: number;

  @Prop({ default: false })
  isMining: boolean;

  @Prop() // 채굴 시작 시간
  miningStartTime?: Date;

  @Prop() // 마지막 채굴 시각
  lastMinedAt?: Date;

  @Prop({ default: 0 })
  totalMined: number;
}

export const MinerSchema = SchemaFactory.createForClass(Miner);

MinerSchema.methods.calculateMiningPoints = function (now: Date = new Date()): number {
  if (!this.isMining || !this.lastMinedAt) return 0;

  const elapsedMs = now.getTime() - this.lastMinedAt.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

  if (elapsedMinutes <= 0) return 0;

  const BASE_MULTIPLIER = 10;
  const points = this.hashRate * BASE_MULTIPLIER * elapsedMinutes;

  this.points += points;
  this.totalMined += points;
  this.lastMinedAt = now;
  return points;
};
