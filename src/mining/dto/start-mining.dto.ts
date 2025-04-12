import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';

export class StartMiningDto {
  @IsNotEmpty()
  @IsString()
  walletAddress: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  hashRate: number;
}