// src/mining/mining.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MiningDocument = Mining & Document;

@Schema({ timestamps: true })
export class Mining {
  @Prop({ required: true })
  walletAddress: string;

  @Prop({ required: true })
  hashRate: number;

  @Prop({ required: true })
  pointsGained: number;

  @Prop({ default: 0 })
  totalMined: number;
}

export const MiningSchema = SchemaFactory.createForClass(Mining);
