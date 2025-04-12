import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MinerDocument = Miner & Document;

@Schema({ timestamps: true })
export class Miner {
  @Prop({ required: true, unique: true })
  walletAddress: string;

  @Prop({ default: 0 })
  points: number;

  @Prop({ default: 0 })
  totalClaimed: number;

  updatedAt?: Date;
}

export const MinerSchema = SchemaFactory.createForClass(Miner);