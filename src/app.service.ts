import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  constructor(@InjectConnection() private readonly connection: Connection) {
    console.log('🚀 AppService constructor 실행됨!'); // ✅ 여기에!

    this.connection.once('open', () => {
      console.log('✅ MongoDB 연결 성공!');
    });
  
    this.connection.on('error', (err) => {
      console.error('❌ MongoDB 연결 실패:', err);
    });
  }
}