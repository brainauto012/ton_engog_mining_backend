// claim.controller.ts
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ClaimService } from './claim.service';

@Controller('claim')
export class ClaimController {
  constructor(private readonly claimService: ClaimService) {}

  @Post()
  async claim(@Body() body: { walletAddress: string }) {  // userId → walletAddress
    const result = await this.claimService.processClaim(body.walletAddress);  // walletAddress로 수정
    if (!result) {
      throw new BadRequestException('Claim failed or insufficient points');
    }
    return { message: 'Claim successful', result };
  }
}
