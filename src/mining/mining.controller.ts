import {
    Controller,
    Post,
    Body,
    Get,
    Query,
    NotFoundException,
    BadRequestException,
  } from '@nestjs/common';
  import { StartMiningDto } from './dto/start-mining.dto';
  import { MiningService } from './mining.service';
  
  @Controller('mining')
  export class MiningController {
    constructor(private readonly miningService: MiningService) {}
  
    // 채굴 시작
    @Post('start')
    async startMining(@Body() dto: StartMiningDto) {
      return this.miningService.startMining(dto);
    }
  
    // 지갑 주소 기준 포인트 현황 조회
    @Get('status')
    async getMiningStatus(@Query('walletAddress') walletAddress: string) {
      if (!walletAddress) {
        throw new BadRequestException('walletAddress 쿼리 파라미터가 필요합니다.');
      }
  
      return this.miningService.getMiningStatus(walletAddress);
    }
  
    // 클레임 요청
    @Post('claim')
    async claimPoints(@Body('walletAddress') walletAddress: string) {
      if (!walletAddress) {
        throw new BadRequestException('지갑 주소가 필요합니다.');
      }
  
      return this.miningService.claimPoints(walletAddress);
    }
  }
  