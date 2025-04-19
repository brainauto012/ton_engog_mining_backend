//miner.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { MinerService } from './miner.service';

@Controller('miner')
export class MinerController {
  constructor(private readonly minerService: MinerService) {}

  @Get(':walletAddress')
  async getMiner(@Param('walletAddress') walletAddress: string) {
    return this.minerService.findMiner(walletAddress);
  }
}
