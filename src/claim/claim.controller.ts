// claim.controller.ts
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ClaimService } from './claim.service';
import { ClaimDto } from './dto/claim.dto';  // DTO 임포트

@Controller('claim')
export class ClaimController {
  constructor(private readonly claimService: ClaimService) {}

  @Post()
  async claim(@Body() body: ClaimDto) {  // DTO 사용
    console.log(`[CLAIM REQUEST] walletAddress: ${body.walletAddress}`); // ✅ 추가
    const result = await this.claimService.processClaim(body.walletAddress);
    if (!result) {
      throw new BadRequestException('Claim failed or insufficient points');
    }
    return { message: 'Claim successful', result };
  }
}
