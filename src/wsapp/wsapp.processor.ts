import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { WsappService } from './wsapp.service';
import { SendMessageDto } from './dto/send-message.dto';

@Processor('wsapp')
export class WsappProcessor {
  constructor(
    private wsappService: WsappService
  ) {}

  @Process('message')
  async handleTranscode(job: Job<SendMessageDto>) {
    Logger.debug('>> [Wsapp service]: New message enter.');

    const state = await this.wsappService.sendMessage(job.data);

    if(!state) {
      throw new Error("Error");
    }
  }
}