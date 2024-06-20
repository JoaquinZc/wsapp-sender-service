import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { WsappService } from './wsapp.service';
import { WsappController } from './wsapp.controller';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { WsappProcessor } from './wsapp.processor';
import { SendMessageDto } from './dto/send-message.dto';
import { Queue } from 'bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'wsapp',
      defaultJobOptions: {
        delay: 1000 * 5, // 5 segundos
        attempts: 3,
        removeOnComplete: true,
      },
    }),
  ],
  providers: [WsappService, WsappProcessor],
  controllers: [WsappController],
  exports: [WsappService],
})
export class WsappModule implements OnModuleDestroy, OnModuleInit {
  constructor(
    private readonly wsappService: WsappService,
    @InjectQueue('wsapp') private readonly messageQueue: Queue<SendMessageDto>
  ) {}

  public async onModuleInit() {
    await this.messageQueue.pause();

    this.wsappService.setHandleReady(async (isReady) => {
      await (
        isReady ? this.messageQueue.resume() :
        this.messageQueue.pause()
      )
    });
  }

  public async onModuleDestroy() {
    this.wsappService.end();
  }
}
