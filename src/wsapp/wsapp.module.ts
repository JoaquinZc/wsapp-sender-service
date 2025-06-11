import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { Queue } from 'bull';

import { WsappService } from './wsapp.service';
import { WsappController } from './wsapp.controller';
import { WsappProcessor } from './wsapp.processor';
import { MessageSender } from './interface/message-sender.interface';
import { BackupWsapp, BackupWsappSchema } from './schema/backup-wsapp.schema';
import { BackupWsappService } from './backup-wsapp.service';

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
    MongooseModule.forFeature([
      {
        name: BackupWsapp.name,
        schema: BackupWsappSchema,
      },
    ]),
  ],
  providers: [WsappService, WsappProcessor, BackupWsappService],
  controllers: [WsappController],
})
export class WsappModule implements OnModuleDestroy, OnModuleInit {
  constructor(
    private readonly wsappService: WsappService,
    @InjectQueue('wsapp') private readonly messageQueue: Queue<MessageSender>,
  ) {}

  public async onModuleInit() {
    await this.messageQueue.pause();

    this.wsappService.setHandleReady(async (isReady) => {
      await (isReady ? this.messageQueue.resume() : this.messageQueue.pause());
    });
  }

  public async onModuleDestroy() {
    this.wsappService.end();
  }
}
