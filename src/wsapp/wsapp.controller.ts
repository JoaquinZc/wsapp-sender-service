import { Body, Controller, Delete, Get, HttpException, HttpStatus, Post, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { image as convertTextoToImageQR } from 'qr-image';

import { WsappService } from './wsapp.service';
import { SendMessageDto } from './dto/send-message.dto';
import { Response } from 'express';
import { WAuthGuard } from './guard/w-auth.guard';
import { MessageSender } from './interface/message-sender.interface';
import { sendMessageToMessageSender } from './adaptor/send-message-to-message-sender.adaptor';

@Controller('wsapp')
export class WsappController {
  constructor(
    private readonly wsappService: WsappService,
    @InjectQueue('wsapp') private readonly messageQueue: Queue<SendMessageDto>,
  ) {}

  @Post()
  @UseGuards(WAuthGuard)
  init() {
    this.wsappService.init();
  }

  @UseGuards(WAuthGuard)
  @Post("send")
  async sendMessage(
    @Body() data: SendMessageDto,
  ) {
    const message: MessageSender = sendMessageToMessageSender(data);

    await this.messageQueue.add("message", message, { jobId: message.id });
    
    return message.id;
  }

  @UseGuards(WAuthGuard)
  @Post("webhook")
  handleWebhook(
    @Res() response: Response,
  ) {
    this.messageQueue.once("completed", (jobId: string) => {
      response.end(jobId);
    });  
  }

  @UseGuards(WAuthGuard)
  @Get()
  getQr(
    @Res() res: Response,
  ) {
    const qr = this.wsappService.getQr();

    if(!qr) {
      throw new HttpException("El QR no está disponible.", HttpStatus.NOT_ACCEPTABLE);
    }

    const image = convertTextoToImageQR(qr, { type: "png", ec_level: "Q" });
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline; filename="qrcode.png"',
    });

    image.on('end', () => {
      res.end();
    });

    image.pipe(res)
  }

  @UseGuards(WAuthGuard)
  @Delete()
  async end() {
    await this.wsappService.logut();
  }
}
