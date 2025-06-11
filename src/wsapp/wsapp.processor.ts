import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { WsappService } from './wsapp.service';
import { MessageSender } from './interface/message-sender.interface';
import { BackupWsappService } from './backup-wsapp.service';
import { SyncBackupDto } from './dto/sync-backup.dto';

@Processor('wsapp')
export class WsappProcessor {
  constructor(
    private wsappService: WsappService,
    private backupWsappService: BackupWsappService,
  ) {}

  @Process('message')
  async handleTranscode(job: Job<MessageSender>) {
    Logger.debug('>> [Wsapp service]: New message enter.');

    const state = await this.wsappService.sendMessage(job.data);

    await this.backupWsappService.sync(
      new SyncBackupDto(job.id.toString(), state ? 'completed' : 'error'),
    );

    if (!state) {
      throw new Error('Error');
    }
  }
}
