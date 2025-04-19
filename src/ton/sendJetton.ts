// src/ton/sendJetton.ts
import { TonClient, WalletContractV4, internal, toNano, Address, beginCell } from 'ton';
import * as dotenv from 'dotenv';
import { mnemonicToPrivateKey } from 'ton-crypto';
import { JettonMaster } from 'ton';
// .env 파일 로드
dotenv.config();


export async function sendJetton({
  recipient,
  jettonMasterAddress,
  jettonAmount,
  tonEndpoint,
}: {
  recipient: string;            // 수신자 지갑 주소
  jettonMasterAddress: string; // Jetton Minter 컨트랙트 주소
  jettonAmount: number;        // 전송할 Jetton 수량
  tonEndpoint: string;         // TON API endpoint
}) {

  // sendJetton 함수 시작 시 딜레이
  await new Promise((res) => setTimeout(res, 3000));

  const mnemonic = process.env.MNEMONIC?.split(' ');
  if (!mnemonic) throw new Error('MNEMONIC 환경변수가 설정되지 않았습니다.');

  const client = new TonClient({ endpoint: tonEndpoint });
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const wallet = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 });
  const sender = client.open(wallet);
  const seqno = await sender.getSeqno();

  // 주소 파싱
  const senderAddress = wallet.address;
  const recipientAddr = Address.parse(recipient);
  const jettonMinterAddr = Address.parse(jettonMasterAddress);

  // Jetton Wallet 주소 가져오기
  const jettonMaster = client.open(JettonMaster.create(jettonMinterAddr));
  const jettonWallet = await jettonMaster.getWalletAddress(senderAddress);

  const jettonTransferAmount = toNano(jettonAmount);

  // 전송 메시지 생성
  const transferBody = beginCell()
    .storeUint(0xf8a7ea5, 32)            // op code
    .storeUint(0, 64)                    // query_id
    .storeCoins(jettonTransferAmount)   // amount
    .storeAddress(recipientAddr)        // destination
    .storeAddress(senderAddress)        // response_destination
    .storeBit(false)                    // custom_payload
    .storeCoins(toNano('0.01'))         // forward_amount
    .storeBit(false)                    // forward_payload
    .endCell();

  // 전송 수행
  await sender.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        to: jettonWallet,
        value: toNano('0.05'), // Jetton 전송 시 최소 TON 수수료
        body: transferBody,
      }),
    ],
  });

  return {
    success: true,
    sentTo: recipient,
    jettonWallet: jettonWallet.toString(),
  };
}