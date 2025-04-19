// src/claim/dto/claim.dto.ts
import { IsString } from 'class-validator';

export class ClaimDto {
  @IsString()
  walletAddress: string;
}
