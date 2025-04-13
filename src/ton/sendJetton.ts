// src/ton/sendJetton.ts
import { TonClient, WalletContractV4, internal, toNano, Address, beginCell } from 'ton';
import * as dotenv from 'dotenv';
import { mnemonicToPrivateKey } from 'ton-crypto';
// .env 파일 로드
dotenv.config();

export async function sendJetton({
  recipient,
  jettonWalletAddress,
  jettonAmount,
  tonEndpoint,
}: {
  recipient: string;           // 받는 사람 지갑 주소
  jettonWalletAddress: string; // 전송할 Jetton 토큰의 지갑 주소
  jettonAmount: number;        // 전송할 토큰 금액
  tonEndpoint: string;         // TON 네트워크 엔드포인트
}) {
  
  // 환경변수에서 mnemonic 값을 가져옴
  const mnemonic = process.env.MNEMONIC?.split(' ');

  if (!mnemonic) {
    throw new Error('PRIVATE_KEY 환경변수가 설정되지 않았습니다.');
  }

  // TON 클라이언트 설정
  const client = new TonClient({ endpoint: tonEndpoint });

  // mnemonic을 통해 개인 키를 생성
  const keyPair = await mnemonicToPrivateKey(mnemonic);
  const wallet = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 });
  const sender = client.open(wallet);
  // 시퀀스 번호 가져오기
  const seqno = await sender.getSeqno();

  // 주소 파싱
  const to = Address.parse(jettonWalletAddress);
  const recipientAddr = Address.parse(recipient);

  // 전송할 토큰 금액
  const jettonTransferAmount = toNano(jettonAmount);

  // 전송 메시지 생성
  const transferBody = beginCell()
    .storeUint(0xf8a7ea5, 32)
    .storeUint(0, 64)
    .storeCoins(toNano(jettonAmount))
    .storeAddress(recipientAddr)
    .storeAddress(sender.address)
    .storeBit(false)
    .storeCoins(toNano('0.01'))
    .storeBit(false)
    .endCell();

  // 전송 수행
  await sender.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        to,
        value: jettonTransferAmount,
        body: transferBody,
      }),
    ],
  });

  return {
    success: true,
    sentTo: recipient,
    jettonWallet: jettonWalletAddress,
  };
}
